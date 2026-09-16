<?php

namespace Tests\Feature\Api;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialProgress;
use App\Models\Module;
use App\Models\Option;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CertificateTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(User $user): string
    {
        auth()->forgetGuards();

        return $user->createToken('test')->plainTextToken;
    }

    private function userWithRole(string $roleName, bool $isActive = true): User
    {
        $role = Role::query()->firstOrCreate(['name' => $roleName], ['description' => $roleName]);

        return User::factory()->create([
            'role_id' => $role->id,
            'is_active' => $isActive,
        ]);
    }

    /**
     * @return array{course: Course, module: Module, material1: Material, material2: Material, quiz: Quiz}
     */
    private function createCourseWithMaterialAndQuiz(): array
    {
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);

        $material1 = Material::factory()->text()->create([
            'module_id' => $module->id,
            'is_mandatory' => true,
        ]);

        $material2 = Material::factory()->text()->create([
            'module_id' => $module->id,
            'is_mandatory' => true,
        ]);

        $quiz = Quiz::factory()->published()->create([
            'module_id' => $module->id,
            'passing_grade' => 70.0,
        ]);

        $question = Question::factory()->create(['quiz_id' => $quiz->id]);
        Option::factory()->create(['question_id' => $question->id, 'is_correct' => true]);
        Option::factory()->create(['question_id' => $question->id, 'is_correct' => false]);

        return [
            'course' => $course,
            'module' => $module,
            'material1' => $material1,
            'material2' => $material2,
            'quiz' => $quiz,
        ];
    }

    public function test_eligible_employee_in_enrolled_status_receives_certificate_and_transitions_to_completed(): void
    {
        $f = $this->createCourseWithMaterialAndQuiz();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $f['course']->id,
            'status' => Enrollment::STATUS_ENROLLED,
            'completed_at' => null,
        ]);

        // Complete all mandatory materials
        MaterialProgress::create(['enrollment_id' => $enrollment->id, 'material_id' => $f['material1']->id, 'completed_at' => now()]);
        MaterialProgress::create(['enrollment_id' => $enrollment->id, 'material_id' => $f['material2']->id, 'completed_at' => now()]);

        // Pass the quiz
        QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
            'score' => 100.0,
            'passed' => true,
            'submitted_at' => now(),
        ]);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/certificate");

        $response->assertCreated();
        $response->assertJsonPath('data.enrollment_id', $enrollment->id);
        $response->assertJsonPath('data.course.id', $f['course']->id);
        $response->assertJsonPath('data.employee.id', $employee->id);
        $this->assertStringStartsWith('ELMS-'.date('Y').'-', $response->json('data.certificate_number'));

        // Enrollment should have transitioned to COMPLETED
        $enrollment->refresh();
        $this->assertSame(Enrollment::STATUS_COMPLETED, $enrollment->status);
        $this->assertNotNull($enrollment->completed_at);

        $this->assertDatabaseHas('certificates', [
            'enrollment_id' => $enrollment->id,
        ]);
    }

    public function test_eligible_employee_in_progress_status_receives_certificate_and_transitions_to_completed(): void
    {
        $f = $this->createCourseWithMaterialAndQuiz();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $f['course']->id,
            'status' => Enrollment::STATUS_IN_PROGRESS,
            'completed_at' => null,
        ]);

        MaterialProgress::create(['enrollment_id' => $enrollment->id, 'material_id' => $f['material1']->id, 'completed_at' => now()]);
        MaterialProgress::create(['enrollment_id' => $enrollment->id, 'material_id' => $f['material2']->id, 'completed_at' => now()]);

        QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
            'passed' => true,
            'submitted_at' => now(),
        ]);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/certificate");

        $response->assertCreated();
        $enrollment->refresh();
        $this->assertSame(Enrollment::STATUS_COMPLETED, $enrollment->status);
        $this->assertNotNull($enrollment->completed_at);
    }

    public function test_already_completed_enrollment_returns_existing_certificate_idempotently(): void
    {
        $f = $this->createCourseWithMaterialAndQuiz();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->completed()->create([
            'user_id' => $employee->id,
            'course_id' => $f['course']->id,
        ]);

        $certificate = Certificate::factory()->create([
            'enrollment_id' => $enrollment->id,
            'certificate_number' => 'ELMS-'.date('Y').'-000001',
        ]);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/certificate");

        $response->assertOk();
        $response->assertJsonPath('data.id', $certificate->id);
        $response->assertJsonPath('data.certificate_number', 'ELMS-'.date('Y').'-000001');

        $this->assertSame(1, Certificate::where('enrollment_id', $enrollment->id)->count());
    }

    public function test_certificate_number_format_and_sequence(): void
    {
        $f = $this->createCourseWithMaterialAndQuiz();
        $employee1 = $this->userWithRole(Role::EMPLOYEE);
        $employee2 = $this->userWithRole(Role::EMPLOYEE);

        $enrollment1 = Enrollment::factory()->create(['user_id' => $employee1->id, 'course_id' => $f['course']->id]);
        $enrollment2 = Enrollment::factory()->create(['user_id' => $employee2->id, 'course_id' => $f['course']->id]);

        // Complete requirements for both
        MaterialProgress::create(['enrollment_id' => $enrollment1->id, 'material_id' => $f['material1']->id, 'completed_at' => now()]);
        MaterialProgress::create(['enrollment_id' => $enrollment1->id, 'material_id' => $f['material2']->id, 'completed_at' => now()]);
        QuizAttempt::factory()->create(['quiz_id' => $f['quiz']->id, 'user_id' => $employee1->id, 'passed' => true, 'submitted_at' => now()]);

        MaterialProgress::create(['enrollment_id' => $enrollment2->id, 'material_id' => $f['material1']->id, 'completed_at' => now()]);
        MaterialProgress::create(['enrollment_id' => $enrollment2->id, 'material_id' => $f['material2']->id, 'completed_at' => now()]);
        QuizAttempt::factory()->create(['quiz_id' => $f['quiz']->id, 'user_id' => $employee2->id, 'passed' => true, 'submitted_at' => now()]);

        $res1 = $this->withToken($this->tokenFor($employee1))->postJson("/api/v1/enrollments/{$enrollment1->id}/certificate");
        $res2 = $this->withToken($this->tokenFor($employee2))->postJson("/api/v1/enrollments/{$enrollment2->id}/certificate");

        $res1->assertCreated();
        $res2->assertCreated();

        $year = date('Y');
        $res1->assertJsonPath('data.certificate_number', "ELMS-{$year}-000001");
        $res2->assertJsonPath('data.certificate_number', "ELMS-{$year}-000002");
    }

    public function test_incomplete_mandatory_material_blocks_certificate(): void
    {
        $f = $this->createCourseWithMaterialAndQuiz();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->create(['user_id' => $employee->id, 'course_id' => $f['course']->id]);

        // Only complete material 1 (material 2 remains incomplete)
        MaterialProgress::create(['enrollment_id' => $enrollment->id, 'material_id' => $f['material1']->id, 'completed_at' => now()]);
        QuizAttempt::factory()->create(['quiz_id' => $f['quiz']->id, 'user_id' => $employee->id, 'passed' => true, 'submitted_at' => now()]);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/certificate");

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('certificate');
        $this->assertDatabaseMissing('certificates', ['enrollment_id' => $enrollment->id]);
    }

    public function test_failed_quiz_blocks_certificate(): void
    {
        $f = $this->createCourseWithMaterialAndQuiz();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->create(['user_id' => $employee->id, 'course_id' => $f['course']->id]);

        // Complete all materials
        MaterialProgress::create(['enrollment_id' => $enrollment->id, 'material_id' => $f['material1']->id, 'completed_at' => now()]);
        MaterialProgress::create(['enrollment_id' => $enrollment->id, 'material_id' => $f['material2']->id, 'completed_at' => now()]);

        // Failed quiz
        QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
            'score' => 40.0,
            'passed' => false,
            'submitted_at' => now(),
        ]);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/certificate");

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('certificate');
        $this->assertDatabaseMissing('certificates', ['enrollment_id' => $enrollment->id]);
    }

    public function test_multiple_quiz_attempts_where_one_passed_allows_certificate(): void
    {
        $f = $this->createCourseWithMaterialAndQuiz();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->create(['user_id' => $employee->id, 'course_id' => $f['course']->id]);

        MaterialProgress::create(['enrollment_id' => $enrollment->id, 'material_id' => $f['material1']->id, 'completed_at' => now()]);
        MaterialProgress::create(['enrollment_id' => $enrollment->id, 'material_id' => $f['material2']->id, 'completed_at' => now()]);

        // Attempt 1 failed
        QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
            'passed' => false,
            'submitted_at' => now(),
        ]);

        // Attempt 2 passed
        QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 2,
            'passed' => true,
            'submitted_at' => now(),
        ]);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/certificate");

        $response->assertCreated();
        $this->assertDatabaseHas('certificates', ['enrollment_id' => $enrollment->id]);
    }

    public function test_course_without_quiz_can_receive_certificate(): void
    {
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $material = Material::factory()->text()->create(['module_id' => $module->id, 'is_mandatory' => true]);

        $employee = $this->userWithRole(Role::EMPLOYEE);
        $enrollment = Enrollment::factory()->create(['user_id' => $employee->id, 'course_id' => $course->id]);

        MaterialProgress::create(['enrollment_id' => $enrollment->id, 'material_id' => $material->id, 'completed_at' => now()]);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/certificate");

        $response->assertCreated();
        $this->assertDatabaseHas('certificates', ['enrollment_id' => $enrollment->id]);
    }

    public function test_course_with_multiple_published_quizzes_requires_all_quizzes_passed(): void
    {
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $quiz1 = Quiz::factory()->published()->create(['module_id' => $module->id]);
        $quiz2 = Quiz::factory()->published()->create(['module_id' => $module->id]);

        $employee = $this->userWithRole(Role::EMPLOYEE);
        $enrollment = Enrollment::factory()->create(['user_id' => $employee->id, 'course_id' => $course->id]);

        // Only passed quiz 1
        QuizAttempt::factory()->create(['quiz_id' => $quiz1->id, 'user_id' => $employee->id, 'passed' => true, 'submitted_at' => now()]);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/certificate");

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('certificate');

        // Now pass quiz 2
        QuizAttempt::factory()->create(['quiz_id' => $quiz2->id, 'user_id' => $employee->id, 'passed' => true, 'submitted_at' => now()]);

        $responseSuccess = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/certificate");

        $responseSuccess->assertCreated();
        $this->assertDatabaseHas('certificates', ['enrollment_id' => $enrollment->id]);
    }

    public function test_draft_quiz_is_not_required_for_certificate(): void
    {
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $publishedQuiz = Quiz::factory()->published()->create(['module_id' => $module->id]);
        Quiz::factory()->draft()->create(['module_id' => $module->id]);

        $employee = $this->userWithRole(Role::EMPLOYEE);
        $enrollment = Enrollment::factory()->create(['user_id' => $employee->id, 'course_id' => $course->id]);

        // Pass only the published quiz
        QuizAttempt::factory()->create(['quiz_id' => $publishedQuiz->id, 'user_id' => $employee->id, 'passed' => true, 'submitted_at' => now()]);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/certificate");

        $response->assertCreated();
        $this->assertDatabaseHas('certificates', ['enrollment_id' => $enrollment->id]);
    }

    public function test_duplicate_certificate_prevention_at_database_level(): void
    {
        $enrollment = Enrollment::factory()->completed()->create();

        Certificate::create([
            'enrollment_id' => $enrollment->id,
            'certificate_number' => 'ELMS-'.date('Y').'-000001',
            'issued_at' => now(),
        ]);

        $this->expectException(QueryException::class);

        Certificate::create([
            'enrollment_id' => $enrollment->id,
            'certificate_number' => 'ELMS-'.date('Y').'-000002',
            'issued_at' => now(),
        ]);
    }

    public function test_employee_can_view_their_own_certificates_via_my_certificates(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $otherEmployee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment1 = Enrollment::factory()->completed()->create(['user_id' => $employee->id]);
        $enrollment2 = Enrollment::factory()->completed()->create(['user_id' => $otherEmployee->id]);

        $cert1 = Certificate::factory()->create(['enrollment_id' => $enrollment1->id]);
        $cert2 = Certificate::factory()->create(['enrollment_id' => $enrollment2->id]);

        $response = $this->withToken($this->tokenFor($employee))
            ->getJson('/api/v1/my-certificates');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $cert1->id);
    }

    public function test_employee_can_view_certificate_detail(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $enrollment = Enrollment::factory()->completed()->create(['user_id' => $employee->id]);
        $certificate = Certificate::factory()->create(['enrollment_id' => $enrollment->id]);

        $response = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/certificates/{$certificate->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $certificate->id);
        $response->assertJsonPath('data.certificate_number', $certificate->certificate_number);
    }

    public function test_other_employee_cannot_view_certificate(): void
    {
        $employee1 = $this->userWithRole(Role::EMPLOYEE);
        $employee2 = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->completed()->create(['user_id' => $employee1->id]);
        $certificate = Certificate::factory()->create(['enrollment_id' => $enrollment->id]);

        $response = $this->withToken($this->tokenFor($employee2))
            ->getJson("/api/v1/certificates/{$certificate->id}");

        $response->assertForbidden();
    }

    public function test_admin_and_assigned_instructor_can_view_certificate(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $instructor = $this->userWithRole(Role::INSTRUCTOR);

        $course = Course::factory()->published()->create();
        $course->instructors()->attach($instructor->id);

        $enrollment = Enrollment::factory()->completed()->create([
            'user_id' => $employee->id,
            'course_id' => $course->id,
        ]);
        $certificate = Certificate::factory()->create(['enrollment_id' => $enrollment->id]);

        $resAdmin = $this->withToken($this->tokenFor($admin))->getJson("/api/v1/certificates/{$certificate->id}");
        $resAdmin->assertOk();

        $resInstructor = $this->withToken($this->tokenFor($instructor))->getJson("/api/v1/certificates/{$certificate->id}");
        $resInstructor->assertOk();
    }

    public function test_unassigned_instructor_cannot_view_certificate(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $instructor = $this->userWithRole(Role::INSTRUCTOR);

        $course = Course::factory()->published()->create();
        $enrollment = Enrollment::factory()->completed()->create([
            'user_id' => $employee->id,
            'course_id' => $course->id,
        ]);
        $certificate = Certificate::factory()->create(['enrollment_id' => $enrollment->id]);

        $response = $this->withToken($this->tokenFor($instructor))->getJson("/api/v1/certificates/{$certificate->id}");
        $response->assertForbidden();
    }

    public function test_employee_cannot_generate_certificate_for_another_employee(): void
    {
        $employee1 = $this->userWithRole(Role::EMPLOYEE);
        $employee2 = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->create(['user_id' => $employee1->id]);

        $response = $this->withToken($this->tokenFor($employee2))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/certificate");

        $response->assertForbidden();
    }
}
