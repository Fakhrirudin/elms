<?php

namespace Tests\Feature\Api;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(User $user): string
    {
        auth()->forgetGuards();

        return $user->createToken('test')->plainTextToken;
    }

    private function userWithRole(string $roleName, bool $isActive = true, ?Department $department = null): User
    {
        $role = Role::query()->firstOrCreate(['name' => $roleName], ['description' => $roleName]);

        return User::factory()->create([
            'role_id' => $role->id,
            'department_id' => $department?->id,
            'is_active' => $isActive,
        ]);
    }

    public function test_authenticated_user_can_list_departments(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $parent = Department::factory()->create(['name' => 'Diplomasi']);
        Department::factory()->create(['name' => 'Protokol', 'parent_id' => $parent->id]);

        $response = $this->withToken($this->tokenFor($employee))
            ->getJson('/api/v1/departments');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'description',
                    'parent_id',
                    'created_at',
                    'updated_at',
                ],
            ],
            'meta' => [
                'current_page',
                'per_page',
                'total',
                'last_page',
            ],
        ]);
    }

    public function test_authenticated_user_can_view_department(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $department = Department::factory()->create(['name' => 'Teknologi Informasi']);

        $response = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/departments/{$department->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $department->id);
        $response->assertJsonPath('data.name', 'Teknologi Informasi');
    }

    public function test_admin_can_create_department(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $parent = Department::factory()->create(['name' => 'Pusat']);

        $response = $this->withToken($this->tokenFor($admin))
            ->postJson('/api/v1/departments', [
                'name' => 'Pengembangan SDM',
                'parent_id' => $parent->id,
                'description' => 'Bagian pelatihan dan kompetensi',
            ]);

        $response->assertCreated();
        $response->assertJsonPath('data.name', 'Pengembangan SDM');
        $response->assertJsonPath('data.parent_id', $parent->id);

        $this->assertDatabaseHas('departments', [
            'name' => 'Pengembangan SDM',
            'parent_id' => $parent->id,
        ]);
    }

    public function test_duplicate_department_name_is_rejected(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        Department::factory()->create(['name' => 'Keuangan']);

        $response = $this->withToken($this->tokenFor($admin))
            ->postJson('/api/v1/departments', [
                'name' => 'Keuangan',
                'description' => 'Deskripsi duplikat',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_admin_can_update_department(): void
    {
        $admin = $this->userWithRole(Role::LEARNING_ADMIN);
        $department = Department::factory()->create(['name' => 'Hukum']);

        $response = $this->withToken($this->tokenFor($admin))
            ->putJson("/api/v1/departments/{$department->id}", [
                'name' => 'Biro Hukum dan Kerjasama',
                'description' => 'Perjanjian internasional dan regulasi',
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.name', 'Biro Hukum dan Kerjasama');
        $this->assertDatabaseHas('departments', [
            'id' => $department->id,
            'name' => 'Biro Hukum dan Kerjasama',
        ]);
    }

    public function test_circular_parent_relationship_is_rejected(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $deptA = Department::factory()->create(['name' => 'Dept A']);
        $deptB = Department::factory()->create(['name' => 'Dept B', 'parent_id' => $deptA->id]);
        $deptC = Department::factory()->create(['name' => 'Dept C', 'parent_id' => $deptB->id]);

        // Attempting to set deptA's parent to itself
        $responseSelf = $this->withToken($this->tokenFor($admin))
            ->putJson("/api/v1/departments/{$deptA->id}", [
                'parent_id' => $deptA->id,
            ]);
        $responseSelf->assertUnprocessable();
        $responseSelf->assertJsonValidationErrors(['parent_id']);

        // Attempting to set deptA's parent to deptC (descendant of deptA)
        $responseDescendant = $this->withToken($this->tokenFor($admin))
            ->putJson("/api/v1/departments/{$deptA->id}", [
                'parent_id' => $deptC->id,
            ]);
        $responseDescendant->assertUnprocessable();
        $responseDescendant->assertJsonValidationErrors(['parent_id']);
    }

    public function test_super_admin_can_delete_unused_department(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $department = Department::factory()->create(['name' => 'Temporary Unit']);

        $response = $this->withToken($this->tokenFor($admin))
            ->deleteJson("/api/v1/departments/{$department->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('departments', ['id' => $department->id]);
    }

    public function test_deletion_blocked_when_users_assigned(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $department = Department::factory()->create(['name' => 'Active Dept']);
        $this->userWithRole(Role::EMPLOYEE, true, $department);

        $response = $this->withToken($this->tokenFor($admin))
            ->deleteJson("/api/v1/departments/{$department->id}");

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['department']);
        $this->assertDatabaseHas('departments', ['id' => $department->id]);
    }

    public function test_deletion_blocked_when_child_departments_exist(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $parent = Department::factory()->create(['name' => 'Parent Dept']);
        Department::factory()->create(['name' => 'Child Dept', 'parent_id' => $parent->id]);

        $response = $this->withToken($this->tokenFor($admin))
            ->deleteJson("/api/v1/departments/{$parent->id}");

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['department']);
        $this->assertDatabaseHas('departments', ['id' => $parent->id]);
    }

    public function test_employee_cannot_create_update_or_delete_department(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $department = Department::factory()->create(['name' => 'Protected Dept']);

        // Create attempt
        $this->withToken($this->tokenFor($employee))
            ->postJson('/api/v1/departments', ['name' => 'Unauthorized'])
            ->assertForbidden();

        // Update attempt
        $this->withToken($this->tokenFor($employee))
            ->putJson("/api/v1/departments/{$department->id}", ['name' => 'Hacked'])
            ->assertForbidden();

        // Delete attempt
        $this->withToken($this->tokenFor($employee))
            ->deleteJson("/api/v1/departments/{$department->id}")
            ->assertForbidden();
    }

    public function test_unauthenticated_access_returns_401(): void
    {
        $this->getJson('/api/v1/departments')->assertUnauthorized();
        $this->postJson('/api/v1/departments', ['name' => 'Anon'])->assertUnauthorized();
        $this->getJson('/api/v1/departments/1')->assertUnauthorized();
        $this->putJson('/api/v1/departments/1', ['name' => 'Anon'])->assertUnauthorized();
        $this->deleteJson('/api/v1/departments/1')->assertUnauthorized();
    }
}
