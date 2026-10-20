<?php

namespace Tests\Feature\Api;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\Module;
use App\Models\Option;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseCompletionTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(User $user): string
    {
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
     * Helper to create a multi-activity course with materials, quiz, and assignment.
     *
     * @return array{course: Course, module: Module, mandatoryMat: Material, optionalMat: Material, quiz: Quiz, requiredAssignment: Assignment, optionalAssignment: Assignment}
     */
    private function createComprehensiveCourse(): array
    {
        $course = Course::factory()->published()->create(['title' => 'Advanced Backend Architecture']);
        $module = Module::factory()->create(['course_id' => $course->id, 'title' => 'Module 1: Architecture']);

        $mandatoryMat = Material::factory()->text()->create([
            'module_id' => $module->id,
            'title' => 'Modular Design Patterns',
            'is_mandatory' => true,
            'sort_order' => 1,
        ]);

        $optionalMat = Material::factory()->text()->create([
            'module_id' => $module->id,
            'title' => 'Supplementary Reading',
            'is_mandatory' => false,
            'sort_order' => 2,
        ]);

        $quiz = Quiz::factory()->published()->create([
            'module_id' => $module->id,
            'title' => 'Architecture Comprehension Quiz',
            'passing_grade' => 70.0,
            'max_attempts' => 3,
        ]);

        $question = Question::factory()->create(['quiz_id' => $quiz->id, 'sort_order' => 1]);
        Option::factory()->create(['question_id' => $question->id, 'is_correct' => true]);
        Option::factory()->create(['question_id' => $question->id, 'is_correct' => false]);

        $requiredAssignment = Assignment::factory()->published()->create([
            'module_id' => $module->id,
            'title' => 'Architecture Implementation Project',
            'is_required' => true,
            'max_score' => 100,
            'max_attempts' => 2,
        ]);

        $optionalAssignment = Assignment::factory()->published()->create([
            'module_id' => $module->id,
            'title' => 'Extra Credit Challenge',
            'is_required' => false,
            'max_score' => 50,
            'max_attempts' => 1,
        ]);

        return compact('course', 'module', 'mandatoryMat', 'optionalMat', 'quiz', 'requiredAssignment', 'optionalAssignment');
    }

    public function test_learner_can_access_own_learning_overview(): void
    {
        $c = $this->createComprehensiveCourse();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $c['course']->id,
            'status' => Enrollment::STATUS_ENROLLED,
        ]);

        $response = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/enrollments/{$enrollment->id}/learning-overview");

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'enrollment_id',
                'course_id',
                'status',
                'progress' => [
                    'overall_percentage',
                    'total_required_activities',
                    'completed_required_activities',
                    'is_completed',
                    'materials',
                    'quizzes',
                    'assignments',
                ],
                'modules_summary' => [
                    'total_modules',
                    'completed_modules',
                ],
                'current_activity',
                'modules',
                'certificate',
            ],
        ]);

        $response->assertJsonPath('data.enrollment_id', $enrollment->id);
        $response->assertJsonPath('data.progress.overall_percentage', 0);
        $response->assertJsonPath('data.progress.total_required_activities', 3); // 1 mandatory material + 1 quiz + 1 required assignment
        $response->assertJsonPath('data.progress.completed_required_activities', 0);
        $response->assertJsonPath('data.progress.is_completed', false);
    }

    public function test_learner_cannot_access_another_enrollment_overview(): void
    {
        $c = $this->createComprehensiveCourse();
        $employeeA = $this->userWithRole(Role::EMPLOYEE);
        $employeeB = $this->userWithRole(Role::EMPLOYEE);

        $enrollmentB = Enrollment::factory()->create([
            'user_id' => $employeeB->id,
            'course_id' => $c['course']->id,
        ]);

        $response = $this->withToken($this->tokenFor($employeeA))
            ->getJson("/api/v1/enrollments/{$enrollmentB->id}/learning-overview");

        $response->assertForbidden();
    }

    public function test_required_material_advances_progress_and_optional_material_does_not_block_completion(): void
    {
        $c = $this->createComprehensiveCourse();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $c['course']->id,
            'status' => Enrollment::STATUS_ENROLLED,
        ]);

        // 1. Complete optional material first - progress should remain 0% for required activities
        $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$c['optionalMat']->id}/complete")
            ->assertOk();

        $resOverview = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/enrollments/{$enrollment->id}/learning-overview");
        $resOverview->assertOk();
        $resOverview->assertJsonPath('data.progress.completed_required_activities', 0);
        $resOverview->assertJsonPath('data.progress.overall_percentage', 0);

        // 2. Complete mandatory material - 1 of 3 required done = 33%
        $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$c['mandatoryMat']->id}/complete")
            ->assertOk();

        $resOverview2 = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/enrollments/{$enrollment->id}/learning-overview");
        $resOverview2->assertOk();
        $resOverview2->assertJsonPath('data.progress.completed_required_activities', 1);
        $resOverview2->assertJsonPath('data.progress.overall_percentage', 33);
        $resOverview2->assertJsonPath('data.status', Enrollment::STATUS_IN_PROGRESS);
    }

    public function test_failed_required_quiz_blocks_completion_and_passed_quiz_advances_progress(): void
    {
        $c = $this->createComprehensiveCourse();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $c['course']->id,
            'status' => Enrollment::STATUS_ENROLLED,
        ]);

        // Complete mandatory material (1/3)
        $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$c['mandatoryMat']->id}/complete");

        // Submit failed quiz attempt
        QuizAttempt::factory()->create([
            'quiz_id' => $c['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
            'score' => 40.0,
            'passed' => false,
            'submitted_at' => now(),
        ]);

        $resOverview = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/enrollments/{$enrollment->id}/learning-overview");
        $resOverview->assertOk();
        $resOverview->assertJsonPath('data.progress.quizzes.passed', 0);
        $resOverview->assertJsonPath('data.progress.completed_required_activities', 1);
        $resOverview->assertJsonPath('data.progress.is_completed', false);

        // Submit passed quiz attempt (2/3 done = 67%)
        QuizAttempt::factory()->create([
            'quiz_id' => $c['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 2,
            'score' => 90.0,
            'passed' => true,
            'submitted_at' => now(),
        ]);

        $resOverview2 = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/enrollments/{$enrollment->id}/learning-overview");
        $resOverview2->assertOk();
        $resOverview2->assertJsonPath('data.progress.quizzes.passed', 1);
        $resOverview2->assertJsonPath('data.progress.completed_required_activities', 2);
        $resOverview2->assertJsonPath('data.progress.overall_percentage', 67);
        $resOverview2->assertJsonPath('data.progress.is_completed', false);
    }

    public function test_needs_revision_assignment_blocks_completion_and_passed_assignment_triggers_course_completion(): void
    {
        $c = $this->createComprehensiveCourse();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $c['course']->id,
            'status' => Enrollment::STATUS_ENROLLED,
        ]);

        // Complete mandatory material (1/3)
        $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$c['mandatoryMat']->id}/complete");

        // Pass quiz (2/3)
        QuizAttempt::factory()->create([
            'quiz_id' => $c['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
            'score' => 100.0,
            'passed' => true,
            'submitted_at' => now(),
        ]);

        // Assignment submission with NEEDS_REVISION
        $sub1 = AssignmentSubmission::factory()->create([
            'assignment_id' => $c['requiredAssignment']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
            'status' => AssignmentSubmission::STATUS_NEEDS_REVISION,
            'score' => 50,
            'feedback' => 'Please revise architecture diagrams.',
            'submitted_at' => now()->subDay(),
            'reviewed_at' => now(),
        ]);

        $resNeedsRev = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/enrollments/{$enrollment->id}/learning-overview");
        $resNeedsRev->assertOk();
        $resNeedsRev->assertJsonPath('data.progress.assignments.passed', 0);
        $resNeedsRev->assertJsonPath('data.progress.completed_required_activities', 2);
        $resNeedsRev->assertJsonPath('data.progress.is_completed', false);
        $resNeedsRev->assertJsonPath('data.status', Enrollment::STATUS_IN_PROGRESS);

        // Resubmit and get reviewed as PASSED (3/3 = 100%)
        $sub2 = AssignmentSubmission::factory()->create([
            'assignment_id' => $c['requiredAssignment']->id,
            'user_id' => $employee->id,
            'attempt_number' => 2,
            'status' => AssignmentSubmission::STATUS_PASSED,
            'score' => 95,
            'feedback' => 'Excellent work.',
            'submitted_at' => now(),
            'reviewed_at' => now(),
        ]);

        // Overview recalculates and triggers COMPLETED status
        $resComplete = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/enrollments/{$enrollment->id}/learning-overview");
        $resComplete->assertOk();
        $resComplete->assertJsonPath('data.progress.assignments.passed', 1);
        $resComplete->assertJsonPath('data.progress.completed_required_activities', 3);
        $resComplete->assertJsonPath('data.progress.overall_percentage', 100);
        $resComplete->assertJsonPath('data.progress.is_completed', true);
        $resComplete->assertJsonPath('data.status', Enrollment::STATUS_COMPLETED);
        $this->assertNotNull($resComplete->json('data.completed_at'));

        // DB assertion
        $enrollment->refresh();
        $this->assertSame(Enrollment::STATUS_COMPLETED, $enrollment->status);
        $this->assertNotNull($enrollment->completed_at);
    }

    public function test_optional_assignment_does_not_block_course_completion(): void
    {
        $c = $this->createComprehensiveCourse();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $c['course']->id,
            'status' => Enrollment::STATUS_ENROLLED,
        ]);

        // Complete mandatory material
        $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$c['mandatoryMat']->id}/complete");

        // Pass quiz
        QuizAttempt::factory()->create([
            'quiz_id' => $c['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
            'score' => 100.0,
            'passed' => true,
            'submitted_at' => now(),
        ]);

        // Pass required assignment (optional assignment remains untouched)
        AssignmentSubmission::factory()->create([
            'assignment_id' => $c['requiredAssignment']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
            'status' => AssignmentSubmission::STATUS_PASSED,
            'score' => 90,
            'submitted_at' => now(),
            'reviewed_at' => now(),
        ]);

        $resOverview = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/enrollments/{$enrollment->id}/learning-overview");

        $resOverview->assertOk();
        $resOverview->assertJsonPath('data.progress.overall_percentage', 100);
        $resOverview->assertJsonPath('data.progress.is_completed', true);
        $resOverview->assertJsonPath('data.status', Enrollment::STATUS_COMPLETED);

        // Certificate eligibility is unlocked
        $resOverview->assertJsonPath('data.certificate.is_eligible', true);
    }

    public function test_current_activity_endpoint_and_last_activity_persistence(): void
    {
        $c = $this->createComprehensiveCourse();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $c['course']->id,
            'status' => Enrollment::STATUS_ENROLLED,
        ]);

        // 1. Initial current activity should be first incomplete required activity (mandatory material)
        $resCur1 = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/enrollments/{$enrollment->id}/current-activity");
        $resCur1->assertOk();
        $resCur1->assertJsonPath('data.current_activity.type', 'MATERIAL');
        $resCur1->assertJsonPath('data.current_activity.id', $c['mandatoryMat']->id);

        // 2. Persist learner opening quiz
        $resUpdate = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/current-activity", [
                'activity_type' => 'QUIZ',
                'activity_id' => $c['quiz']->id,
            ]);
        $resUpdate->assertOk();

        $enrollment->refresh();
        $this->assertSame('QUIZ', $enrollment->last_activity_type);
        $this->assertSame($c['quiz']->id, $enrollment->last_activity_id);
        $this->assertNotNull($enrollment->last_accessed_at);

        // 3. Now current activity reflects the persisted incomplete quiz
        $resCur2 = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/enrollments/{$enrollment->id}/current-activity");
        $resCur2->assertOk();
        $resCur2->assertJsonPath('data.current_activity.type', 'QUIZ');
        $resCur2->assertJsonPath('data.current_activity.id', $c['quiz']->id);

        // 4. Updating with invalid activity from another course is rejected
        $courseOther = Course::factory()->published()->create();
        $moduleOther = Module::factory()->create(['course_id' => $courseOther->id]);
        $matOther = Material::factory()->create(['module_id' => $moduleOther->id]);

        $resInvalid = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/current-activity", [
                'activity_type' => 'MATERIAL',
                'activity_id' => $matOther->id,
            ]);
        $resInvalid->assertStatus(422);
    }

    public function test_recalculate_progress_endpoint(): void
    {
        $c = $this->createComprehensiveCourse();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $c['course']->id,
            'status' => Enrollment::STATUS_ENROLLED,
        ]);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/recalculate-progress");

        $response->assertOk();
        $response->assertJsonPath('data.enrollment_id', $enrollment->id);
        $response->assertJsonPath('data.progress.overall_percentage', 0);
    }

    public function test_my_courses_endpoint_includes_authoritative_progress_data(): void
    {
        $c = $this->createComprehensiveCourse();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $c['course']->id,
            'status' => Enrollment::STATUS_IN_PROGRESS,
            'last_activity_type' => 'MATERIAL',
            'last_activity_id' => $c['mandatoryMat']->id,
            'last_accessed_at' => now(),
        ]);

        // Complete 1 material (1/3)
        $enrollment->materialProgress()->create([
            'material_id' => $c['mandatoryMat']->id,
            'completed_at' => now(),
        ]);

        $response = $this->withToken($this->tokenFor($employee))
            ->getJson('/api/v1/my-courses');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $item = $data[0];

        $this->assertSame($enrollment->id, $item['id']);
        $this->assertArrayHasKey('progress', $item);
        $this->assertSame(33, $item['progress']['percentage']);
        $this->assertSame(3, $item['progress']['total_required']);
        $this->assertSame(1, $item['progress']['completed_required']);
        $this->assertSame(1, $item['progress']['total_modules']);
        $this->assertSame(0, $item['progress']['completed_modules']);
        $this->assertSame('Modular Design Patterns', $item['progress']['last_activity']['title']);
    }
}
