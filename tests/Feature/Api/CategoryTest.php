<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Course;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
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

    public function test_super_admin_can_list_categories(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        Category::factory()->count(3)->create();

        $response = $this->withToken($this->tokenFor($admin))->getJson('/api/v1/categories');

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => ['id', 'name', 'slug', 'description', 'created_at', 'updated_at'],
            ],
        ]);
    }

    public function test_learning_admin_can_list_categories(): void
    {
        $admin = $this->userWithRole(Role::LEARNING_ADMIN);
        Category::factory()->create(['name' => 'Backend Development']);

        $response = $this->withToken($this->tokenFor($admin))->getJson('/api/v1/categories');

        $response->assertOk();
        $response->assertJsonFragment(['name' => 'Backend Development']);
    }

    public function test_instructor_cannot_list_categories(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);

        $response = $this->withToken($this->tokenFor($instructor))->getJson('/api/v1/categories');

        $response->assertStatus(403);
        $response->assertJson(['success' => false]);
    }

    public function test_employee_cannot_list_categories(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $response = $this->withToken($this->tokenFor($employee))->getJson('/api/v1/categories');

        $response->assertStatus(403);
        $response->assertJson(['success' => false]);
    }

    public function test_unauthenticated_request_to_categories_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/categories');

        $response->assertStatus(401);
    }

    public function test_super_admin_can_create_category_with_auto_generated_slug(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);

        $response = $this->withToken($this->tokenFor($admin))->postJson('/api/v1/categories', [
            'name' => 'Software Engineering',
            'description' => 'Courses about software engineering principles.',
        ]);

        $response->assertCreated();
        $response->assertJson([
            'success' => true,
            'message' => 'Category created successfully',
            'data' => [
                'name' => 'Software Engineering',
                'slug' => 'software-engineering',
                'description' => 'Courses about software engineering principles.',
            ],
        ]);

        $this->assertDatabaseHas('categories', [
            'name' => 'Software Engineering',
            'slug' => 'software-engineering',
        ]);
    }

    public function test_creating_category_with_duplicate_name_is_rejected(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        Category::factory()->create(['name' => 'Existing Category']);

        $response = $this->withToken($this->tokenFor($admin))->postJson('/api/v1/categories', [
            'name' => 'Existing Category',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('name');
    }

    public function test_super_admin_can_view_category_detail(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $category = Category::factory()->create(['name' => 'Cloud Computing']);

        $response = $this->withToken($this->tokenFor($admin))->getJson("/api/v1/categories/{$category->id}");

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'id' => $category->id,
                'name' => 'Cloud Computing',
                'slug' => $category->slug,
            ],
        ]);
    }

    public function test_super_admin_can_update_category_and_slug_is_updated(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $category = Category::factory()->create([
            'name' => 'Old Category Name',
            'slug' => 'old-category-name',
        ]);

        $response = $this->withToken($this->tokenFor($admin))->putJson("/api/v1/categories/{$category->id}", [
            'name' => 'New Category Name',
            'description' => 'Updated description.',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'name' => 'New Category Name',
                'slug' => 'new-category-name',
                'description' => 'Updated description.',
            ],
        ]);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'New Category Name',
            'slug' => 'new-category-name',
        ]);
    }

    public function test_super_admin_can_delete_category(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $category = Category::factory()->create();

        $response = $this->withToken($this->tokenFor($admin))->deleteJson("/api/v1/categories/{$category->id}");

        $response->assertOk();
        $response->assertJson(['success' => true, 'message' => 'Category deleted successfully']);
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_cannot_delete_category_that_is_in_use_by_courses(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $category = Category::factory()->create();
        Course::factory()->create(['category_id' => $category->id]);

        $response = $this->withToken($this->tokenFor($admin))->deleteJson("/api/v1/categories/{$category->id}");

        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
            'message' => 'Cannot delete category that is currently used by courses.',
        ]);
        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }
}
