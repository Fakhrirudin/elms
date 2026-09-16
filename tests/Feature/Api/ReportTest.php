<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Course;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialProgress;
use App\Models\Module;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(User $user): string
    {
        auth()->forgetGuards();

        return $user->createToken('test')->plainTextToken;
    }

    private function userWithRole(string $roleName, bool $isActive = true, ?Department $dept = null): User
    {
        $role = Role::query()->firstOrCreate(['name' => $roleName], ['description' => $roleName]);

        return User::factory()->create([
            'role_id' => $role->id,
            'department_id' => $dept?->id,
            'is_active' => $isActive,
        ]);
    }

    public function test_admin_can_retrieve_course_report_with_filters(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $category = Category::factory()->create(['name' => 'Backend Development']);

        $course1 = Course::factory()->published()->create(['category_id' => $category->id, 'title' => 'Laravel 11 Masterclass']);
        $course2 = Course::factory()->published()->create(['category_id' => $category->id, 'title' => 'PostgreSQL Optimization']);

        // Course 1: 2 enrollments (1 completed, 1 in_progress) -> 50% completion rate
        Enrollment::factory()->completed()->create(['course_id' => $course1->id]);
        Enrollment::factory()->inProgress()->create(['course_id' => $course1->id]);

        // Course 2: 1 enrollment (completed) -> 100% completion rate
        Enrollment::factory()->completed()->create(['course_id' => $course2->id]);

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson("/api/v1/reports/courses?course_id={$course1->id}");

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.course_id', $course1->id);
        $response->assertJsonPath('data.0.total_enrollments', 2);
        $response->assertJsonPath('data.0.in_progress_count', 1);
        $response->assertJsonPath('data.0.completed_count', 1);
        $response->assertJsonPath('data.0.completion_rate', 50);
        $response->assertJsonPath('data.0.category.name', 'Backend Development');
    }

    public function test_instructor_course_report_is_scoped_to_assigned_courses(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $otherInstructor = $this->userWithRole(Role::INSTRUCTOR);

        $assignedCourse = Course::factory()->published()->create(['title' => 'Assigned Course']);
        $unassignedCourse = Course::factory()->published()->create(['title' => 'Unassigned Course']);

        $assignedCourse->instructors()->attach($instructor->id);
        $unassignedCourse->instructors()->attach($otherInstructor->id);

        $response = $this->withToken($this->tokenFor($instructor))
            ->getJson('/api/v1/reports/courses');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.course_id', $assignedCourse->id);
    }

    public function test_employee_cannot_access_course_report(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $response = $this->withToken($this->tokenFor($employee))
            ->getJson('/api/v1/reports/courses');

        $response->assertForbidden();
    }

    public function test_admin_can_retrieve_learning_report_with_filters(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $deptA = Department::create(['name' => 'Diplomasi']);
        $deptB = Department::create(['name' => 'Protokol']);

        $empA = $this->userWithRole(Role::EMPLOYEE, true, $deptA);
        $empB = $this->userWithRole(Role::EMPLOYEE, true, $deptB);

        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $mat1 = Material::factory()->text()->create(['module_id' => $module->id, 'is_mandatory' => true]);
        $mat2 = Material::factory()->text()->create(['module_id' => $module->id, 'is_mandatory' => true]);

        // Emp A: completed 1 of 2 mandatory materials (50% progress)
        $enrollmentA = Enrollment::factory()->inProgress()->create(['user_id' => $empA->id, 'course_id' => $course->id]);
        MaterialProgress::create(['enrollment_id' => $enrollmentA->id, 'material_id' => $mat1->id, 'completed_at' => now()]);

        // Emp B: completed both (100% progress)
        $enrollmentB = Enrollment::factory()->completed()->create(['user_id' => $empB->id, 'course_id' => $course->id]);
        MaterialProgress::create(['enrollment_id' => $enrollmentB->id, 'material_id' => $mat1->id, 'completed_at' => now()]);
        MaterialProgress::create(['enrollment_id' => $enrollmentB->id, 'material_id' => $mat2->id, 'completed_at' => now()]);

        // Filter by Department A
        $response = $this->withToken($this->tokenFor($admin))
            ->getJson("/api/v1/reports/learning?department_id={$deptA->id}");

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.enrollment_id', $enrollmentA->id);
        $response->assertJsonPath('data.0.employee.name', $empA->name);
        $response->assertJsonPath('data.0.employee.department', 'Diplomasi');
        $response->assertJsonPath('data.0.progress', 50);
    }

    public function test_instructor_learning_report_is_scoped_to_assigned_courses(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $otherInstructor = $this->userWithRole(Role::INSTRUCTOR);

        $assignedCourse = Course::factory()->published()->create();
        $unassignedCourse = Course::factory()->published()->create();

        $assignedCourse->instructors()->attach($instructor->id);
        $unassignedCourse->instructors()->attach($otherInstructor->id);

        $employee = $this->userWithRole(Role::EMPLOYEE);

        $enrollmentAssigned = Enrollment::factory()->create(['user_id' => $employee->id, 'course_id' => $assignedCourse->id]);
        Enrollment::factory()->create(['user_id' => $employee->id, 'course_id' => $unassignedCourse->id]);

        $response = $this->withToken($this->tokenFor($instructor))
            ->getJson('/api/v1/reports/learning');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.enrollment_id', $enrollmentAssigned->id);
    }

    public function test_employee_learning_report_is_strictly_scoped_to_own_records(): void
    {
        $employee1 = $this->userWithRole(Role::EMPLOYEE);
        $employee2 = $this->userWithRole(Role::EMPLOYEE);

        $course = Course::factory()->published()->create();

        $enrollment1 = Enrollment::factory()->create(['user_id' => $employee1->id, 'course_id' => $course->id]);
        Enrollment::factory()->create(['user_id' => $employee2->id, 'course_id' => $course->id]);

        $response = $this->withToken($this->tokenFor($employee1))
            ->getJson('/api/v1/reports/learning');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.enrollment_id', $enrollment1->id);
        $response->assertJsonPath('data.0.employee.id', $employee1->id);
    }

    public function test_admin_can_retrieve_quiz_performance_report(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);

        $quiz = Quiz::factory()->published()->create([
            'module_id' => $module->id,
            'title' => 'Security Fundamentals Quiz',
            'passing_grade' => 70.0,
        ]);

        $emp1 = $this->userWithRole(Role::EMPLOYEE);
        $emp2 = $this->userWithRole(Role::EMPLOYEE);

        // 2 passed (80, 100), 1 failed (40) -> total 3 attempts, avg 73.33, pass_rate 66.67%, min 40, max 100
        QuizAttempt::factory()->create(['quiz_id' => $quiz->id, 'user_id' => $emp1->id, 'attempt_number' => 1, 'score' => 80.0, 'passed' => true, 'submitted_at' => now()]);
        QuizAttempt::factory()->create(['quiz_id' => $quiz->id, 'user_id' => $emp1->id, 'attempt_number' => 2, 'score' => 100.0, 'passed' => true, 'submitted_at' => now()]);
        QuizAttempt::factory()->create(['quiz_id' => $quiz->id, 'user_id' => $emp2->id, 'attempt_number' => 1, 'score' => 40.0, 'passed' => false, 'submitted_at' => now()]);

        // 1 unsubmitted attempt (must be excluded from stats)
        QuizAttempt::factory()->create(['quiz_id' => $quiz->id, 'user_id' => $emp2->id, 'attempt_number' => 2, 'submitted_at' => null]);

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson("/api/v1/reports/quiz?quiz_id={$quiz->id}");

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.quiz_id', $quiz->id);
        $response->assertJsonPath('data.0.quiz_title', 'Security Fundamentals Quiz');
        $response->assertJsonPath('data.0.passing_grade', 70);
        $response->assertJsonPath('data.0.total_attempts', 3);
        $response->assertJsonPath('data.0.total_passed', 2);
        $response->assertJsonPath('data.0.total_failed', 1);
        $response->assertJsonPath('data.0.pass_rate', 66.67);
        $response->assertJsonPath('data.0.average_score', 73.33);
        $response->assertJsonPath('data.0.min_score', 40);
        $response->assertJsonPath('data.0.max_score', 100);
    }

    public function test_instructor_quiz_report_is_scoped_to_assigned_courses(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $otherInstructor = $this->userWithRole(Role::INSTRUCTOR);

        $assignedCourse = Course::factory()->published()->create();
        $unassignedCourse = Course::factory()->published()->create();

        $assignedCourse->instructors()->attach($instructor->id);
        $unassignedCourse->instructors()->attach($otherInstructor->id);

        $mod1 = Module::factory()->create(['course_id' => $assignedCourse->id]);
        $mod2 = Module::factory()->create(['course_id' => $unassignedCourse->id]);

        $assignedQuiz = Quiz::factory()->published()->create(['module_id' => $mod1->id]);
        Quiz::factory()->published()->create(['module_id' => $mod2->id]);

        $response = $this->withToken($this->tokenFor($instructor))
            ->getJson('/api/v1/reports/quiz');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.quiz_id', $assignedQuiz->id);
    }

    public function test_employee_cannot_access_quiz_report(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $response = $this->withToken($this->tokenFor($employee))
            ->getJson('/api/v1/reports/quiz');

        $response->assertForbidden();
    }
}
