<?php

namespace Tests\Feature\Api;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
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

    public function test_employee_receives_employee_dashboard_metrics(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course1 = Course::factory()->published()->create();
        $course2 = Course::factory()->published()->create();
        $course3 = Course::factory()->published()->create();

        // 1 enrolled, 1 in_progress, 1 completed
        Enrollment::factory()->create(['user_id' => $employee->id, 'course_id' => $course1->id, 'status' => Enrollment::STATUS_ENROLLED]);
        Enrollment::factory()->inProgress()->create(['user_id' => $employee->id, 'course_id' => $course2->id]);
        $enrollment3 = Enrollment::factory()->completed()->create(['user_id' => $employee->id, 'course_id' => $course3->id]);

        // 1 certificate
        Certificate::factory()->create(['enrollment_id' => $enrollment3->id]);

        $response = $this->withToken($this->tokenFor($employee))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $response->assertJsonPath('data.total_courses', 3);
        $response->assertJsonPath('data.in_progress', 2);
        $response->assertJsonPath('data.completed', 1);
        $response->assertJsonPath('data.certificates', 1);
    }

    public function test_instructor_receives_assigned_course_dashboard_metrics(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $otherInstructor = $this->userWithRole(Role::INSTRUCTOR);

        $course1 = Course::factory()->published()->create();
        $course2 = Course::factory()->published()->create();
        $otherCourse = Course::factory()->published()->create();

        $course1->instructors()->attach($instructor->id);
        $course2->instructors()->attach($instructor->id);
        $otherCourse->instructors()->attach($otherInstructor->id);

        $mod1 = Module::factory()->create(['course_id' => $course1->id]);
        $quiz1 = Quiz::factory()->published()->create(['module_id' => $mod1->id]);

        $employee1 = $this->userWithRole(Role::EMPLOYEE);
        $employee2 = $this->userWithRole(Role::EMPLOYEE);

        // Course 1: 2 enrollments (1 completed, 1 in_progress)
        Enrollment::factory()->completed()->create(['user_id' => $employee1->id, 'course_id' => $course1->id]);
        Enrollment::factory()->inProgress()->create(['user_id' => $employee2->id, 'course_id' => $course1->id]);

        // Course 2: 1 enrollment (in_progress)
        Enrollment::factory()->inProgress()->create(['user_id' => $employee1->id, 'course_id' => $course2->id]);

        // Other course: 1 enrollment (must not be counted)
        Enrollment::factory()->completed()->create(['user_id' => $employee2->id, 'course_id' => $otherCourse->id]);

        // Submitted quiz attempts for Course 1
        QuizAttempt::factory()->create(['quiz_id' => $quiz1->id, 'user_id' => $employee1->id, 'score' => 80.0, 'submitted_at' => now()]);
        QuizAttempt::factory()->create(['quiz_id' => $quiz1->id, 'user_id' => $employee2->id, 'score' => 90.0, 'submitted_at' => now()]);

        $response = $this->withToken($this->tokenFor($instructor))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $response->assertJsonPath('data.assigned_courses', 2);
        $response->assertJsonPath('data.total_enrollments', 3);
        $response->assertJsonPath('data.completed_courses', 1);
        $response->assertJsonPath('data.average_quiz_score', 85);
    }

    public function test_instructor_receives_zero_average_quiz_score_when_no_submitted_attempts(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->published()->create();
        $course->instructors()->attach($instructor->id);

        $response = $this->withToken($this->tokenFor($instructor))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $response->assertJsonPath('data.assigned_courses', 1);
        $response->assertJsonPath('data.average_quiz_score', 0);
    }

    public function test_admin_receives_institution_dashboard_metrics(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);

        // 2 employees
        $this->userWithRole(Role::EMPLOYEE);
        $this->userWithRole(Role::EMPLOYEE);

        // Courses
        $course1 = Course::factory()->published()->create();
        $course2 = Course::factory()->draft()->create();

        // Enrollments
        Enrollment::factory()->completed()->create(['course_id' => $course1->id]);
        Enrollment::factory()->create(['course_id' => $course1->id]);

        // Quiz attempts
        $module = Module::factory()->create(['course_id' => $course1->id]);
        $quiz = Quiz::factory()->published()->create(['module_id' => $module->id]);
        QuizAttempt::factory()->create(['quiz_id' => $quiz->id, 'score' => 70.0, 'submitted_at' => now()]);
        QuizAttempt::factory()->create(['quiz_id' => $quiz->id, 'score' => 90.0, 'submitted_at' => now()]);

        $response = $this->withToken($this->tokenFor($admin))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $response->assertJsonPath('data.total_employees', 2);
        $response->assertJsonPath('data.total_courses', 2);
        $response->assertJsonPath('data.published_courses', 1);
        $response->assertJsonPath('data.total_enrollments', 2);
        $response->assertJsonPath('data.completed_courses', 1);
        $response->assertJsonPath('data.average_quiz_score', 80);
    }

    public function test_admin_receives_zero_average_quiz_score_when_no_submitted_attempts(): void
    {
        $admin = $this->userWithRole(Role::LEARNING_ADMIN);

        $response = $this->withToken($this->tokenFor($admin))->getJson('/api/v1/dashboard');

        $response->assertOk();
        $response->assertJsonPath('data.average_quiz_score', 0);
    }

    public function test_unauthenticated_user_cannot_access_dashboard(): void
    {
        $response = $this->getJson('/api/v1/dashboard');

        $response->assertUnauthorized();
    }
}
