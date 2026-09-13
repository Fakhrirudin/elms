<?php

namespace Tests\Feature\Api;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserTest extends TestCase
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

    public function test_super_admin_can_list_users(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $employeeRole = Role::query()->firstOrCreate(['name' => Role::EMPLOYEE]);
        User::factory()->count(3)->create(['role_id' => $employeeRole->id]);

        $response = $this->withToken($this->tokenFor($admin))->getJson('/api/v1/users');

        $response->assertOk();
        $response->assertJsonStructure([
            'success', 'message', 'data',
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
        ]);
    }

    public function test_instructor_cannot_list_users(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);

        $response = $this->withToken($this->tokenFor($instructor))->getJson('/api/v1/users');

        $response->assertStatus(403);
        $response->assertJson(['success' => false]);
    }

    public function test_employee_cannot_list_users(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $response = $this->withToken($this->tokenFor($employee))->getJson('/api/v1/users');

        $response->assertStatus(403);
        $response->assertJson(['success' => false]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(401);
    }

    public function test_super_admin_can_view_user_detail(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $response = $this->withToken($this->tokenFor($admin))->getJson("/api/v1/users/{$employee->id}");

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'id' => $employee->id,
                'email' => $employee->email,
                'role' => ['name' => Role::EMPLOYEE],
            ],
        ]);
    }

    public function test_super_admin_can_create_user_with_role_and_department(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $role = Role::query()->firstOrCreate(['name' => Role::INSTRUCTOR], ['description' => 'Instructor']);
        $department = Department::create(['name' => 'IT Department']);

        $response = $this->withToken($this->tokenFor($admin))->postJson('/api/v1/users', [
            'name' => 'New Instructor',
            'email' => 'new.instructor@example.com',
            'password' => 'Password123!',
            'role_id' => $role->id,
            'department_id' => $department->id,
        ]);

        $response->assertCreated();
        $response->assertJson([
            'success' => true,
            'data' => [
                'name' => 'New Instructor',
                'email' => 'new.instructor@example.com',
                'role' => ['id' => $role->id, 'name' => Role::INSTRUCTOR],
                'department' => ['id' => $department->id, 'name' => 'IT Department'],
            ],
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'new.instructor@example.com',
            'role_id' => $role->id,
            'department_id' => $department->id,
        ]);
    }

    public function test_creating_user_with_duplicate_email_is_rejected(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $existing = $this->userWithRole(Role::EMPLOYEE);
        $role = Role::query()->firstOrCreate(['name' => Role::EMPLOYEE]);

        $response = $this->withToken($this->tokenFor($admin))->postJson('/api/v1/users', [
            'name' => 'Duplicate',
            'email' => $existing->email,
            'password' => 'Password123!',
            'role_id' => $role->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }

    public function test_created_user_password_is_hashed_and_never_returned(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $role = Role::query()->firstOrCreate(['name' => Role::EMPLOYEE]);

        $response = $this->withToken($this->tokenFor($admin))->postJson('/api/v1/users', [
            'name' => 'Plain Password Check',
            'email' => 'plain.check@example.com',
            'password' => 'Password123!',
            'role_id' => $role->id,
        ]);

        $response->assertCreated();
        $response->assertJsonMissingPath('data.password');

        $created = User::where('email', 'plain.check@example.com')->firstOrFail();
        $this->assertNotSame('Password123!', $created->password);
        $this->assertTrue(Hash::check('Password123!', $created->password));
    }

    public function test_super_admin_can_update_user_profile(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $department = Department::create(['name' => 'Finance']);

        $response = $this->withToken($this->tokenFor($admin))->putJson("/api/v1/users/{$employee->id}", [
            'name' => 'Updated Name',
            'department_id' => $department->id,
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'name' => 'Updated Name',
                'department' => ['id' => $department->id, 'name' => 'Finance'],
            ],
        ]);
    }

    public function test_super_admin_can_activate_and_deactivate_user(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $response = $this->withToken($this->tokenFor($admin))->patchJson("/api/v1/users/{$employee->id}/status", [
            'is_active' => false,
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true, 'data' => ['is_active' => false]]);
        $this->assertDatabaseHas('users', ['id' => $employee->id, 'is_active' => false]);
    }

    public function test_user_cannot_change_their_own_role(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $otherRole = Role::query()->firstOrCreate(['name' => Role::LEARNING_ADMIN]);

        $response = $this->withToken($this->tokenFor($admin))->putJson("/api/v1/users/{$admin->id}", [
            'role_id' => $otherRole->id,
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'role_id' => $admin->role_id]);
    }

    public function test_learning_admin_cannot_manage_super_admin_account(): void
    {
        $learningAdmin = $this->userWithRole(Role::LEARNING_ADMIN);
        $superAdmin = $this->userWithRole(Role::SUPER_ADMIN);

        $response = $this->withToken($this->tokenFor($learningAdmin))->putJson("/api/v1/users/{$superAdmin->id}", [
            'name' => 'Hacked Name',
        ]);

        $response->assertStatus(403);
    }

    public function test_learning_admin_cannot_assign_admin_tier_role(): void
    {
        $learningAdmin = $this->userWithRole(Role::LEARNING_ADMIN);
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $superAdminRole = Role::query()->firstOrCreate(['name' => Role::SUPER_ADMIN]);

        $response = $this->withToken($this->tokenFor($learningAdmin))->putJson("/api/v1/users/{$employee->id}", [
            'role_id' => $superAdminRole->id,
        ]);

        $response->assertStatus(403);
    }
}
