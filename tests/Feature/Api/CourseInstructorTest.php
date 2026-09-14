<?php

namespace Tests\Feature\Api;

use App\Models\Course;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseInstructorTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(User $user): string
    {
        return $user->createToken('test')->plainTextToken;
    }

    private function userWithRole(string $roleName): User
    {
        $role = Role::query()->firstOrCreate(['name' => $roleName], ['description' => $roleName]);

        return User::factory()->create(['role_id' => $role->id]);
    }

    public function test_admin_can_view_course_instructors_list(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();
        $course->instructors()->attach($instructor->id);

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson("/api/v1/courses/{$course->id}/instructors");

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'message' => 'Course instructors retrieved successfully',
            'data' => [
                [
                    'id' => $instructor->id,
                    'name' => $instructor->name,
                    'email' => $instructor->email,
                ],
            ],
        ]);
    }

    public function test_admin_can_assign_instructor_to_course(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();

        $response = $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/courses/{$course->id}/instructors", [
                'user_id' => $instructor->id,
            ]);

        $response->assertCreated();
        $response->assertJson([
            'success' => true,
            'message' => 'Instructor assigned successfully',
        ]);
        $this->assertDatabaseHas('course_instructors', [
            'course_id' => $course->id,
            'user_id' => $instructor->id,
        ]);
    }

    public function test_assigning_user_without_instructor_role_fails_validation(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->create();

        $response = $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/courses/{$course->id}/instructors", [
                'user_id' => $employee->id,
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('user_id');
        $this->assertDatabaseMissing('course_instructors', [
            'course_id' => $course->id,
            'user_id' => $employee->id,
        ]);
    }

    public function test_admin_can_sync_instructors_for_course(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $instructorA = $this->userWithRole(Role::INSTRUCTOR);
        $instructorB = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();

        $response = $this->withToken($this->tokenFor($admin))
            ->putJson("/api/v1/courses/{$course->id}/instructors", [
                'instructor_ids' => [$instructorA->id, $instructorB->id],
            ]);

        $response->assertOk();
        $response->assertJson(['success' => true, 'message' => 'Instructors updated successfully']);
        $this->assertDatabaseHas('course_instructors', ['course_id' => $course->id, 'user_id' => $instructorA->id]);
        $this->assertDatabaseHas('course_instructors', ['course_id' => $course->id, 'user_id' => $instructorB->id]);
    }

    public function test_syncing_with_non_instructor_user_fails_validation(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->create();

        $response = $this->withToken($this->tokenFor($admin))
            ->putJson("/api/v1/courses/{$course->id}/instructors", [
                'instructor_ids' => [$instructor->id, $employee->id],
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('instructor_ids');
    }

    public function test_admin_can_remove_instructor_from_course(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();
        $course->instructors()->attach($instructor->id);

        $response = $this->withToken($this->tokenFor($admin))
            ->deleteJson("/api/v1/courses/{$course->id}/instructors/{$instructor->id}");

        $response->assertOk();
        $response->assertJson(['success' => true, 'message' => 'Instructor removed successfully']);
        $this->assertDatabaseMissing('course_instructors', [
            'course_id' => $course->id,
            'user_id' => $instructor->id,
        ]);
    }

    public function test_instructor_and_employee_cannot_manage_instructors(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $targetInstructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();

        $this->withToken($this->tokenFor($instructor))
            ->postJson("/api/v1/courses/{$course->id}/instructors", ['user_id' => $targetInstructor->id])
            ->assertStatus(403);

        $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/courses/{$course->id}/instructors", ['user_id' => $targetInstructor->id])
            ->assertStatus(403);
    }

    public function test_deleting_course_cascades_and_removes_pivot_entries(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();
        $course->instructors()->attach($instructor->id);

        $this->assertDatabaseHas('course_instructors', [
            'course_id' => $course->id,
            'user_id' => $instructor->id,
        ]);

        $this->withToken($this->tokenFor($admin))
            ->deleteJson("/api/v1/courses/{$course->id}")
            ->assertOk();

        $this->assertDatabaseMissing('course_instructors', [
            'course_id' => $course->id,
            'user_id' => $instructor->id,
        ]);
    }
}
