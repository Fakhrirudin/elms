<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Course;
use App\Models\Material;
use App\Models\Module;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseAuthoringTest extends TestCase
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

    public function test_super_admin_can_create_course(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $category = Category::factory()->create();

        $response = $this->withToken($this->tokenFor($admin))->postJson('/api/v1/courses', [
            'title' => 'Admin Course',
            'category_id' => $category->id,
            'description' => 'Admin created course.',
            'estimated_duration' => 120,
        ]);

        $response->assertCreated();
        $response->assertJson([
            'success' => true,
            'data' => [
                'title' => 'Admin Course',
                'status' => Course::STATUS_DRAFT,
            ],
        ]);
        $this->assertDatabaseHas('courses', ['title' => 'Admin Course', 'status' => Course::STATUS_DRAFT]);
    }

    public function test_learning_admin_can_create_course(): void
    {
        $admin = $this->userWithRole(Role::LEARNING_ADMIN);
        $category = Category::factory()->create();

        $response = $this->withToken($this->tokenFor($admin))->postJson('/api/v1/courses', [
            'title' => 'Learning Admin Course',
            'category_id' => $category->id,
            'estimated_duration' => 90,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('courses', ['title' => 'Learning Admin Course']);
    }

    public function test_instructor_can_create_course_and_is_automatically_assigned(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $category = Category::factory()->create();

        $response = $this->withToken($this->tokenFor($instructor))->postJson('/api/v1/courses', [
            'title' => 'Instructor Authored Course',
            'category_id' => $category->id,
            'description' => 'Authored by instructor.',
            'estimated_duration' => 180,
        ]);

        $response->assertCreated();
        $courseId = $response->json('data.id');

        $this->assertDatabaseHas('courses', [
            'id' => $courseId,
            'title' => 'Instructor Authored Course',
            'status' => Course::STATUS_DRAFT,
        ]);

        // Verify instructor is attached automatically
        $this->assertDatabaseHas('course_instructors', [
            'course_id' => $courseId,
            'user_id' => $instructor->id,
        ]);
    }

    public function test_employee_cannot_create_course(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $category = Category::factory()->create();

        $response = $this->withToken($this->tokenFor($employee))->postJson('/api/v1/courses', [
            'title' => 'Hacked Employee Course',
            'category_id' => $category->id,
            'estimated_duration' => 60,
        ]);

        $response->assertStatus(403);
    }

    public function test_instructor_can_update_assigned_course_only(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $otherInstructor = $this->userWithRole(Role::INSTRUCTOR);

        $assignedCourse = Course::factory()->create(['title' => 'Original Assigned Title']);
        $assignedCourse->instructors()->attach($instructor->id);

        $unassignedCourse = Course::factory()->create(['title' => 'Unassigned Title']);
        $unassignedCourse->instructors()->attach($otherInstructor->id);

        // Can update assigned course
        $response1 = $this->withToken($this->tokenFor($instructor))->putJson("/api/v1/courses/{$assignedCourse->id}", [
            'title' => 'Updated Assigned Title',
        ]);
        $response1->assertOk();
        $this->assertSame('Updated Assigned Title', $response1->json('data.title'));

        // Cannot update unassigned course
        $response2 = $this->withToken($this->tokenFor($instructor))->putJson("/api/v1/courses/{$unassignedCourse->id}", [
            'title' => 'Malicious Update',
        ]);
        $response2->assertStatus(403);
    }

    public function test_admin_can_publish_draft_course(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->draft()->create();

        $response = $this->withToken($this->tokenFor($admin))->patchJson("/api/v1/courses/{$course->id}/status", [
            'status' => Course::STATUS_PUBLISHED,
        ]);

        $response->assertOk();
        $response->assertJson(['data' => ['status' => Course::STATUS_PUBLISHED]]);

        $course->refresh();
        $this->assertSame(Course::STATUS_PUBLISHED, $course->status);
        $this->assertNotNull($course->published_at);
    }

    public function test_admin_can_archive_published_course(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->published()->create();

        $response = $this->withToken($this->tokenFor($admin))->patchJson("/api/v1/courses/{$course->id}/status", [
            'status' => Course::STATUS_ARCHIVED,
        ]);

        $response->assertOk();
        $response->assertJson(['data' => ['status' => Course::STATUS_ARCHIVED]]);

        $course->refresh();
        $this->assertSame(Course::STATUS_ARCHIVED, $course->status);
    }

    public function test_instructor_cannot_publish_or_archive_course(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->draft()->create();
        $course->instructors()->attach($instructor->id);

        $response = $this->withToken($this->tokenFor($instructor))->patchJson("/api/v1/courses/{$course->id}/status", [
            'status' => Course::STATUS_PUBLISHED,
        ]);

        $response->assertStatus(403);
    }

    public function test_employee_cannot_publish_or_archive_course(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->draft()->create();

        $response = $this->withToken($this->tokenFor($employee))->patchJson("/api/v1/courses/{$course->id}/status", [
            'status' => Course::STATUS_PUBLISHED,
        ]);

        $response->assertStatus(403);
    }

    public function test_archived_course_cannot_be_enrolled_by_employee(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->archived()->create();

        $response = $this->withToken($this->tokenFor($employee))->postJson("/api/v1/courses/{$course->id}/enroll");

        $response->assertStatus(403);
    }

    public function test_course_listing_includes_modules_and_materials_count(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->create();

        $module1 = Module::factory()->create(['course_id' => $course->id, 'sort_order' => 1]);
        $module2 = Module::factory()->create(['course_id' => $course->id, 'sort_order' => 2]);

        Material::factory()->create(['module_id' => $module1->id]);
        Material::factory()->create(['module_id' => $module1->id]);
        Material::factory()->create(['module_id' => $module2->id]);

        $response = $this->withToken($this->tokenFor($admin))->getJson("/api/v1/courses?search={$course->title}");

        $response->assertOk();
        $matched = collect($response->json('data'))->firstWhere('id', $course->id);
        $this->assertNotNull($matched);
        $this->assertSame(2, $matched['modules_count']);
        $this->assertSame(3, $matched['materials_count']);
    }

    public function test_instructor_can_create_and_manage_modules_on_assigned_course(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();
        $course->instructors()->attach($instructor->id);

        // Create module
        $response = $this->withToken($this->tokenFor($instructor))->postJson("/api/v1/courses/{$course->id}/modules", [
            'title' => 'Module 1: Introduction',
            'description' => 'Intro module',
            'sort_order' => 1,
        ]);
        $response->assertCreated();
        $moduleId = $response->json('data.id');

        // Create material in module
        $matResponse = $this->withToken($this->tokenFor($instructor))->postJson("/api/v1/modules/{$moduleId}/materials", [
            'title' => 'Lesson 1: Overview',
            'type' => 'TEXT',
            'content' => 'Welcome to the course.',
            'sort_order' => 1,
            'is_mandatory' => true,
        ]);
        $matResponse->assertCreated();

        // Update module
        $updateResponse = $this->withToken($this->tokenFor($instructor))->putJson("/api/v1/modules/{$moduleId}", [
            'title' => 'Module 1: Updated Title',
        ]);
        $updateResponse->assertOk();
        $this->assertSame('Module 1: Updated Title', $updateResponse->json('data.title'));
    }

    public function test_instructor_cannot_manage_modules_on_unassigned_course(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();

        $response = $this->withToken($this->tokenFor($instructor))->postJson("/api/v1/courses/{$course->id}/modules", [
            'title' => 'Unauthorized Module',
            'sort_order' => 1,
        ]);

        $response->assertStatus(403);
    }
}
