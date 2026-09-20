<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Course;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseTest extends TestCase
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

    public function test_admin_can_list_courses_with_pagination(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        Course::factory()->count(5)->create();

        $response = $this->withToken($this->tokenFor($admin))->getJson('/api/v1/courses?per_page=2');

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id', 'title', 'slug', 'description', 'thumbnail',
                    'category', 'estimated_duration', 'status', 'published_at',
                    'instructors', 'created_at', 'updated_at',
                ],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
        ]);
        $this->assertCount(2, $response->json('data'));
    }

    public function test_admin_can_filter_courses_by_status_and_category(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $categoryA = Category::factory()->create();
        $categoryB = Category::factory()->create();

        $courseMatch = Course::factory()->published()->create(['category_id' => $categoryA->id, 'title' => 'Matching Course']);
        Course::factory()->draft()->create(['category_id' => $categoryA->id, 'title' => 'Draft in Cat A']);
        Course::factory()->published()->create(['category_id' => $categoryB->id, 'title' => 'Published in Cat B']);

        $response = $this->withToken($this->tokenFor($admin))->getJson("/api/v1/courses?category_id={$categoryA->id}&status=PUBLISHED");

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertSame($courseMatch->id, $data[0]['id']);
    }

    public function test_admin_can_search_courses_by_title_or_description(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        Course::factory()->create(['title' => 'Advanced Microservices Architecture']);
        Course::factory()->create(['title' => 'Introduction to Algorithms']);

        $response = $this->withToken($this->tokenFor($admin))->getJson('/api/v1/courses?search=microservices');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertStringContainsString('Microservices', $data[0]['title']);
    }

    public function test_employee_can_only_see_published_courses_in_list(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);

        Course::factory()->published()->create(['title' => 'Visible Course']);
        Course::factory()->draft()->create(['title' => 'Hidden Draft Course']);
        Course::factory()->archived()->create(['title' => 'Hidden Archived Course']);

        $response = $this->withToken($this->tokenFor($employee))->getJson('/api/v1/courses');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertSame('Visible Course', $data[0]['title']);
    }

    public function test_employee_cannot_see_draft_courses_even_if_requesting_status_filter(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        Course::factory()->draft()->create(['title' => 'Hidden Draft Course']);

        $response = $this->withToken($this->tokenFor($employee))->getJson('/api/v1/courses?status=DRAFT');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(0, $data);
    }

    public function test_instructor_can_see_published_and_assigned_draft_courses(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $otherInstructor = $this->userWithRole(Role::INSTRUCTOR);

        $published = Course::factory()->published()->create(['title' => 'Public Course']);
        $assignedDraft = Course::factory()->draft()->create(['title' => 'Assigned Draft Course']);
        $assignedDraft->instructors()->attach($instructor->id);

        $unassignedDraft = Course::factory()->draft()->create(['title' => 'Unassigned Draft Course']);
        $unassignedDraft->instructors()->attach($otherInstructor->id);

        $response = $this->withToken($this->tokenFor($instructor))->getJson('/api/v1/courses');

        $response->assertOk();
        $titles = collect($response->json('data'))->pluck('title')->all();
        $this->assertContains('Public Course', $titles);
        $this->assertContains('Assigned Draft Course', $titles);
        $this->assertNotContains('Unassigned Draft Course', $titles);
    }

    public function test_admin_can_create_course_with_auto_generated_unique_slug_and_initial_draft_status(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $category = Category::factory()->create();

        $response = $this->withToken($this->tokenFor($admin))->postJson('/api/v1/courses', [
            'title' => 'Laravel Backend Development',
            'category_id' => $category->id,
            'description' => 'Learn Laravel modular backend development.',
            'estimated_duration' => 240,
        ]);

        $response->assertCreated();
        $response->assertJson([
            'success' => true,
            'message' => 'Course created successfully',
            'data' => [
                'title' => 'Laravel Backend Development',
                'slug' => 'laravel-backend-development',
                'status' => Course::STATUS_DRAFT,
                'published_at' => null,
                'category' => ['id' => $category->id, 'name' => $category->name],
            ],
        ]);

        $this->assertDatabaseHas('courses', [
            'title' => 'Laravel Backend Development',
            'slug' => 'laravel-backend-development',
            'status' => Course::STATUS_DRAFT,
        ]);
    }

    public function test_duplicate_course_title_gets_unique_slug_suffix(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $category = Category::factory()->create();

        Course::factory()->create(['title' => 'Clean Code Principles', 'slug' => 'clean-code-principles']);

        $response = $this->withToken($this->tokenFor($admin))->postJson('/api/v1/courses', [
            'title' => 'Clean Code Principles',
            'category_id' => $category->id,
            'estimated_duration' => 180,
        ]);

        $response->assertCreated();
        $this->assertSame('clean-code-principles-1', $response->json('data.slug'));
    }

    public function test_creating_course_requires_title_category_and_duration(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);

        $response = $this->withToken($this->tokenFor($admin))->postJson('/api/v1/courses', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['title', 'category_id', 'estimated_duration']);
    }

    public function test_admin_can_view_any_course_detail(): void
    {
        $admin = $this->userWithRole(Role::LEARNING_ADMIN);
        $course = Course::factory()->draft()->create();

        $response = $this->withToken($this->tokenFor($admin))->getJson("/api/v1/courses/{$course->id}");

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'id' => $course->id,
                'title' => $course->title,
                'status' => Course::STATUS_DRAFT,
            ],
        ]);
    }

    public function test_employee_can_view_published_course_detail(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();

        $response = $this->withToken($this->tokenFor($employee))->getJson("/api/v1/courses/{$course->id}");

        $response->assertOk();
        $response->assertJson(['success' => true, 'data' => ['id' => $course->id]]);
    }

    public function test_employee_cannot_view_draft_course_detail(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->draft()->create();

        $response = $this->withToken($this->tokenFor($employee))->getJson("/api/v1/courses/{$course->id}");

        $response->assertStatus(403);
    }

    public function test_instructor_can_view_assigned_draft_course_detail(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->draft()->create();
        $course->instructors()->attach($instructor->id);

        $response = $this->withToken($this->tokenFor($instructor))->getJson("/api/v1/courses/{$course->id}");

        $response->assertOk();
        $response->assertJson(['success' => true, 'data' => ['id' => $course->id]]);
    }

    public function test_instructor_cannot_view_unassigned_draft_course_detail(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->draft()->create();

        $response = $this->withToken($this->tokenFor($instructor))->getJson("/api/v1/courses/{$course->id}");

        $response->assertStatus(403);
    }

    public function test_admin_can_update_course_metadata(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $category = Category::factory()->create();
        $course = Course::factory()->create(['title' => 'Original Title']);

        $response = $this->withToken($this->tokenFor($admin))->putJson("/api/v1/courses/{$course->id}", [
            'title' => 'Updated Course Title',
            'category_id' => $category->id,
            'estimated_duration' => 300,
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'title' => 'Updated Course Title',
                'slug' => 'updated-course-title',
                'estimated_duration' => 300,
            ],
        ]);
        $this->assertDatabaseHas('courses', ['id' => $course->id, 'title' => 'Updated Course Title']);
    }

    public function test_instructor_can_update_assigned_course_metadata(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create(['title' => 'Original Title']);
        $course->instructors()->attach($instructor->id);

        $response = $this->withToken($this->tokenFor($instructor))->putJson("/api/v1/courses/{$course->id}", [
            'title' => 'Instructor Updated Title',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'title' => 'Instructor Updated Title',
            ],
        ]);
        $this->assertDatabaseHas('courses', ['id' => $course->id, 'title' => 'Instructor Updated Title']);
    }

    public function test_instructor_cannot_update_unassigned_course_metadata(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create(['title' => 'Other Course']);

        $response = $this->withToken($this->tokenFor($instructor))->putJson("/api/v1/courses/{$course->id}", [
            'title' => 'Instructor Hacked Title',
        ]);

        $response->assertStatus(403);
    }

    public function test_employee_cannot_update_course_metadata(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->create();

        $response = $this->withToken($this->tokenFor($employee))->putJson("/api/v1/courses/{$course->id}", [
            'title' => 'Employee Attempt',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_update_course_status_to_published_setting_published_at(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->draft()->create();
        $this->assertNull($course->published_at);

        $response = $this->withToken($this->tokenFor($admin))->patchJson("/api/v1/courses/{$course->id}/status", [
            'status' => Course::STATUS_PUBLISHED,
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'status' => Course::STATUS_PUBLISHED,
            ],
        ]);

        $course->refresh();
        $this->assertSame(Course::STATUS_PUBLISHED, $course->status);
        $this->assertNotNull($course->published_at);
    }

    public function test_admin_can_delete_course(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->create();

        $response = $this->withToken($this->tokenFor($admin))->deleteJson("/api/v1/courses/{$course->id}");

        $response->assertOk();
        $response->assertJson(['success' => true, 'message' => 'Course deleted successfully']);
        $this->assertDatabaseMissing('courses', ['id' => $course->id]);
    }

    public function test_instructor_and_employee_cannot_delete_course(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->create();

        $this->withToken($this->tokenFor($instructor))
            ->deleteJson("/api/v1/courses/{$course->id}")
            ->assertStatus(403);

        $this->withToken($this->tokenFor($employee))
            ->deleteJson("/api/v1/courses/{$course->id}")
            ->assertStatus(403);
    }

    public function test_unauthenticated_request_to_courses_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/courses');

        $response->assertStatus(401);
    }
}
