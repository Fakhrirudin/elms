<?php

namespace Tests\Feature\Api;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_employee_registration_succeeds(): void
    {
        $employeeRole = Role::factory()->employee()->create();
        $department = Department::factory()->create();

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Budi Pratama',
            'email' => 'budi@elms.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'department_id' => $department->id,
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'user' => [
                    'name' => 'Budi Pratama',
                    'email' => 'budi@elms.test',
                    'role' => Role::EMPLOYEE,
                    'department' => [
                        'id' => $department->id,
                        'name' => $department->name,
                    ],
                ],
            ],
        ]);
        $response->assertJsonStructure([
            'data' => [
                'user' => ['id', 'name', 'email', 'role', 'department'],
                'token',
            ],
        ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Budi Pratama',
            'email' => 'budi@elms.test',
            'role_id' => $employeeRole->id,
            'department_id' => $department->id,
            'is_active' => true,
        ]);
    }

    public function test_duplicate_email_rejected(): void
    {
        Role::factory()->employee()->create();
        $department = Department::factory()->create();
        User::factory()->create(['email' => 'existing@elms.test']);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Duplicate User',
            'email' => 'existing@elms.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'department_id' => $department->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_invalid_email_rejected(): void
    {
        Role::factory()->employee()->create();
        $department = Department::factory()->create();

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'not-an-email',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'department_id' => $department->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_password_confirmation_mismatch_rejected(): void
    {
        Role::factory()->employee()->create();
        $department = Department::factory()->create();

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'user@elms.test',
            'password' => 'Password123!',
            'password_confirmation' => 'DifferentPassword123!',
            'department_id' => $department->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_invalid_department_rejected(): void
    {
        Role::factory()->employee()->create();

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'user@elms.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'department_id' => 999999,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['department_id']);
    }

    public function test_self_registration_always_creates_employee(): void
    {
        $employeeRole = Role::factory()->employee()->create();
        $department = Department::factory()->create();

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'New Learner',
            'email' => 'learner@elms.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'department_id' => $department->id,
        ]);

        $response->assertStatus(201);
        $createdUser = User::where('email', 'learner@elms.test')->firstOrFail();
        $this->assertEquals($employeeRole->id, $createdUser->role_id);
        $this->assertEquals(Role::EMPLOYEE, $createdUser->role->name);
    }

    public function test_role_escalation_fields_cannot_create_privileged_roles(): void
    {
        $superAdminRole = Role::factory()->superAdmin()->create();
        $employeeRole = Role::factory()->employee()->create();
        $department = Department::factory()->create();

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Malicious User',
            'email' => 'attacker@elms.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'department_id' => $department->id,
            'role_id' => $superAdminRole->id,
            'role' => Role::SUPER_ADMIN,
            'is_admin' => true,
            'permissions' => ['*'],
        ]);

        $response->assertStatus(201);
        $user = User::where('email', 'attacker@elms.test')->firstOrFail();

        $this->assertEquals($employeeRole->id, $user->role_id);
        $this->assertNotEquals($superAdminRole->id, $user->role_id);
        $this->assertEquals(Role::EMPLOYEE, $user->role->name);
    }

    public function test_password_is_hashed(): void
    {
        Role::factory()->employee()->create();
        $department = Department::factory()->create();

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Secure User',
            'email' => 'secure@elms.test',
            'password' => 'PlainTextPassword123!',
            'password_confirmation' => 'PlainTextPassword123!',
            'department_id' => $department->id,
        ])->assertStatus(201);

        $user = User::where('email', 'secure@elms.test')->firstOrFail();
        $this->assertNotEquals('PlainTextPassword123!', $user->password);
        $this->assertTrue(Hash::check('PlainTextPassword123!', $user->password));
    }

    public function test_successful_registration_returns_expected_user_and_token(): void
    {
        Role::factory()->employee()->create();
        $department = Department::factory()->create();

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Format Check',
            'email' => 'format@elms.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'department_id' => $department->id,
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertArrayHasKey('token', $data);
        $this->assertNotEmpty($data['token']);
        $this->assertArrayHasKey('user', $data);
        $this->assertEquals('Format Check', $data['user']['name']);
        $this->assertEquals('format@elms.test', $data['user']['email']);
        $this->assertEquals(Role::EMPLOYEE, $data['user']['role']);
        $this->assertEquals($department->id, $data['user']['department']['id']);
    }

    public function test_public_can_fetch_departments_for_registration(): void
    {
        $deptA = Department::factory()->create(['name' => 'Alpha Department']);
        $deptB = Department::factory()->create(['name' => 'Beta Department']);

        $response = $this->getJson('/api/v1/auth/departments');

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'message' => 'Departments retrieved successfully',
        ]);
        $response->assertJsonFragment(['name' => 'Alpha Department']);
        $response->assertJsonFragment(['name' => 'Beta Department']);
    }
}
