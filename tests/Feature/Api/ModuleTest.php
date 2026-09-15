<?php

namespace Tests\Feature\Api;

use App\Models\Course;
use App\Models\Material;
use App\Models\Module;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModuleTest extends TestCase
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

    public function test_admin_can_list_modules_of_a_course(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->create();
        $module1 = Module::factory()->create(['course_id' => $course->id, 'sort_order' => 1]);
        $module2 = Module::factory()->create(['course_id' => $course->id, 'sort_order' => 2]);
        Material::factory()->create(['module_id' => $module1->id]);

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson("/api/v1/courses/{$course->id}/modules");

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id', 'course_id', 'title', 'description', 'sort_order',
                    'materials', 'created_at', 'updated_at',
                ],
            ],
        ]);
        $this->assertCount(2, $response->json('data'));
        $this->assertCount(1, $response->json('data.0.materials'));
    }

    public function test_admin_can_create_module_with_auto_sort_order(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->create();
        Module::factory()->create(['course_id' => $course->id, 'sort_order' => 5]);

        $payload = [
            'title' => 'Introduction to Laravel',
            'description' => 'Basics of Laravel framework',
        ];

        $response = $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/courses/{$course->id}/modules", $payload);

        $response->assertCreated();
        $response->assertJsonPath('data.title', 'Introduction to Laravel');
        $response->assertJsonPath('data.sort_order', 6);
        $this->assertDatabaseHas('modules', [
            'course_id' => $course->id,
            'title' => 'Introduction to Laravel',
            'sort_order' => 6,
        ]);
    }

    public function test_assigned_instructor_can_create_module_for_assigned_course(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();
        $course->instructors()->attach($instructor->id);

        $payload = ['title' => 'Instructor Module'];

        $response = $this->withToken($this->tokenFor($instructor))
            ->postJson("/api/v1/courses/{$course->id}/modules", $payload);

        $response->assertCreated();
        $this->assertDatabaseHas('modules', [
            'course_id' => $course->id,
            'title' => 'Instructor Module',
        ]);
    }

    public function test_unassigned_instructor_cannot_create_module(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();

        $response = $this->withToken($this->tokenFor($instructor))
            ->postJson("/api/v1/courses/{$course->id}/modules", ['title' => 'Unauthorized Module']);

        $response->assertForbidden();
    }

    public function test_employee_cannot_create_module(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->create();

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/courses/{$course->id}/modules", ['title' => 'Unauthorized Module']);

        $response->assertForbidden();
    }

    public function test_admin_can_view_single_module(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $module = Module::factory()->create();

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson("/api/v1/modules/{$module->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $module->id);
    }

    public function test_employee_can_view_module_of_published_course(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);

        $response = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/modules/{$module->id}");

        $response->assertOk();

        $listResponse = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/courses/{$course->id}/modules");

        $listResponse->assertOk();
    }

    public function test_employee_cannot_view_module_of_draft_course(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->draft()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);

        $response = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/modules/{$module->id}");

        $response->assertForbidden();

        $listResponse = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/courses/{$course->id}/modules");

        $listResponse->assertForbidden();
    }

    public function test_assigned_instructor_can_update_module(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();
        $course->instructors()->attach($instructor->id);
        $module = Module::factory()->create(['course_id' => $course->id]);

        $response = $this->withToken($this->tokenFor($instructor))
            ->putJson("/api/v1/modules/{$module->id}", [
                'title' => 'Updated Module Title',
                'description' => 'Updated description',
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.title', 'Updated Module Title');
        $this->assertDatabaseHas('modules', [
            'id' => $module->id,
            'title' => 'Updated Module Title',
        ]);
    }

    public function test_unassigned_instructor_cannot_update_module(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);

        $response = $this->withToken($this->tokenFor($instructor))
            ->putJson("/api/v1/modules/{$module->id}", ['title' => 'Updated Module Title']);

        $response->assertForbidden();
    }

    public function test_employee_cannot_update_or_delete_module(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);

        $updateResponse = $this->withToken($this->tokenFor($employee))
            ->putJson("/api/v1/modules/{$module->id}", ['title' => 'Hacked Title']);
        $updateResponse->assertForbidden();

        $deleteResponse = $this->withToken($this->tokenFor($employee))
            ->deleteJson("/api/v1/modules/{$module->id}");
        $deleteResponse->assertForbidden();
    }

    public function test_admin_can_delete_module_and_cascades_to_materials(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $module = Module::factory()->create();
        $material = Material::factory()->create(['module_id' => $module->id]);

        $response = $this->withToken($this->tokenFor($admin))
            ->deleteJson("/api/v1/modules/{$module->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('modules', ['id' => $module->id]);
        $this->assertDatabaseMissing('materials', ['id' => $material->id]);
    }

    public function test_reorder_modules_successfully(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->create();
        $module1 = Module::factory()->create(['course_id' => $course->id, 'sort_order' => 1]);
        $module2 = Module::factory()->create(['course_id' => $course->id, 'sort_order' => 2]);
        $module3 = Module::factory()->create(['course_id' => $course->id, 'sort_order' => 3]);

        $payload = [
            'modules' => [
                ['id' => $module1->id, 'sort_order' => 3],
                ['id' => $module2->id, 'sort_order' => 1],
                ['id' => $module3->id, 'sort_order' => 2],
            ],
        ];

        $response = $this->withToken($this->tokenFor($admin))
            ->patchJson("/api/v1/courses/{$course->id}/modules/reorder", $payload);

        $response->assertOk();
        $this->assertEquals(3, $module1->fresh()->sort_order);
        $this->assertEquals(1, $module2->fresh()->sort_order);
        $this->assertEquals(2, $module3->fresh()->sort_order);
    }

    public function test_reorder_modules_rejects_module_from_different_course(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $courseA = Course::factory()->create();
        $courseB = Course::factory()->create();
        $moduleA = Module::factory()->create(['course_id' => $courseA->id, 'sort_order' => 1]);
        $moduleB = Module::factory()->create(['course_id' => $courseB->id, 'sort_order' => 2]);

        $payload = [
            'modules' => [
                ['id' => $moduleA->id, 'sort_order' => 2],
                ['id' => $moduleB->id, 'sort_order' => 1],
            ],
        ];

        $response = $this->withToken($this->tokenFor($admin))
            ->patchJson("/api/v1/courses/{$courseA->id}/modules/reorder", $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['modules']);
    }

    public function test_create_module_validation_errors(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->create();

        $response = $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/courses/{$course->id}/modules", []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['title']);
    }
}
