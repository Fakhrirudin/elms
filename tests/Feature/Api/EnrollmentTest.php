<?php

namespace Tests\Feature\Api;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnrollmentTest extends TestCase
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

    public function test_employee_can_enroll_in_published_course(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/courses/{$course->id}/enroll");

        $response->assertCreated();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'user_id',
                'course_id',
                'status',
                'enrolled_at',
                'completed_at',
                'course',
                'created_at',
                'updated_at',
            ],
        ]);
        $response->assertJsonPath('data.course_id', $course->id);
        $response->assertJsonPath('data.user_id', $employee->id);
        $response->assertJsonPath('data.status', Enrollment::STATUS_ENROLLED);

        $this->assertDatabaseHas('enrollments', [
            'user_id' => $employee->id,
            'course_id' => $course->id,
            'status' => Enrollment::STATUS_ENROLLED,
        ]);
    }

    public function test_employee_cannot_enroll_in_draft_course(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->draft()->create();

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/courses/{$course->id}/enroll");

        $response->assertForbidden();
        $this->assertDatabaseMissing('enrollments', [
            'user_id' => $employee->id,
            'course_id' => $course->id,
        ]);
    }

    public function test_employee_cannot_enroll_in_archived_course(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->archived()->create();

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/courses/{$course->id}/enroll");

        $response->assertForbidden();
        $this->assertDatabaseMissing('enrollments', [
            'user_id' => $employee->id,
            'course_id' => $course->id,
        ]);
    }

    public function test_employee_cannot_enroll_twice_in_same_course(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();

        Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $course->id,
            'status' => Enrollment::STATUS_ENROLLED,
        ]);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/courses/{$course->id}/enroll");

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['course']);
    }

    public function test_admin_cannot_enroll_in_course(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->published()->create();

        $response = $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/courses/{$course->id}/enroll");

        $response->assertForbidden();
    }

    public function test_instructor_cannot_enroll_in_course(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->published()->create();

        $response = $this->withToken($this->tokenFor($instructor))
            ->postJson("/api/v1/courses/{$course->id}/enroll");

        $response->assertForbidden();
    }

    public function test_inactive_employee_cannot_enroll_in_course(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE, isActive: false);
        $course = Course::factory()->published()->create();

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/courses/{$course->id}/enroll");

        $response->assertForbidden();
    }

    public function test_employee_can_list_my_courses_with_pagination(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $otherEmployee = $this->userWithRole(Role::EMPLOYEE);

        Enrollment::factory()->count(3)->create(['user_id' => $employee->id]);
        Enrollment::factory()->count(2)->create(['user_id' => $otherEmployee->id]);

        $response = $this->withToken($this->tokenFor($employee))
            ->getJson('/api/v1/my-courses?per_page=2');

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'user_id',
                    'course_id',
                    'status',
                    'enrolled_at',
                    'completed_at',
                    'course',
                ],
            ],
            'meta' => [
                'current_page',
                'per_page',
                'total',
                'last_page',
            ],
        ]);
        $this->assertCount(2, $response->json('data'));
        $this->assertEquals(3, $response->json('meta.total'));
    }

    public function test_employee_can_filter_my_courses_by_status(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);

        Enrollment::factory()->create([
            'user_id' => $employee->id,
            'status' => Enrollment::STATUS_ENROLLED,
        ]);
        Enrollment::factory()->inProgress()->create([
            'user_id' => $employee->id,
        ]);
        Enrollment::factory()->completed()->create([
            'user_id' => $employee->id,
        ]);

        $response = $this->withToken($this->tokenFor($employee))
            ->getJson('/api/v1/my-courses?status=IN_PROGRESS');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals(Enrollment::STATUS_IN_PROGRESS, $response->json('data.0.status'));
    }

    public function test_employee_can_view_own_enrollment_detail(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $enrollment = Enrollment::factory()->create(['user_id' => $employee->id]);

        $response = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/enrollments/{$enrollment->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $enrollment->id);
        $response->assertJsonPath('data.user_id', $employee->id);
    }

    public function test_employee_cannot_view_other_employee_enrollment_detail(): void
    {
        $employeeA = $this->userWithRole(Role::EMPLOYEE);
        $employeeB = $this->userWithRole(Role::EMPLOYEE);
        $enrollment = Enrollment::factory()->create(['user_id' => $employeeB->id]);

        $response = $this->withToken($this->tokenFor($employeeA))
            ->getJson("/api/v1/enrollments/{$enrollment->id}");

        $response->assertForbidden();
    }

    public function test_admin_can_view_any_employee_enrollment_detail(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $enrollment = Enrollment::factory()->create(['user_id' => $employee->id]);

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson("/api/v1/enrollments/{$enrollment->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $enrollment->id);
    }
}
