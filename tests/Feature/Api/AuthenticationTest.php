<?php

namespace Tests\Feature\Api;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        $role = Role::factory()->employee()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email' => 'employee@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'employee@example.com',
            'password' => 'password',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => Role::EMPLOYEE,
                ],
            ],
        ]);
        $response->assertJsonStructure([
            'data' => [
                'user' => ['id', 'name', 'email', 'role'],
                'token',
            ],
        ]);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $role = Role::factory()->employee()->create();
        User::factory()->create([
            'role_id' => $role->id,
            'email' => 'employee@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'employee@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
        $response->assertJson(['success' => false]);
        $response->assertJsonMissingPath('data.token');
    }

    public function test_inactive_user_cannot_login(): void
    {
        $role = Role::factory()->employee()->create();
        User::factory()->inactive()->create([
            'role_id' => $role->id,
            'email' => 'inactive@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'inactive@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(401);
        $response->assertJson(['success' => false]);
    }

    public function test_login_response_never_exposes_the_password(): void
    {
        $role = Role::factory()->employee()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email' => 'employee@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'employee@example.com',
            'password' => 'password',
        ]);

        $response->assertOk();
        $response->assertJsonMissingPath('data.user.password');
        $this->assertStringNotContainsString($user->password, $response->getContent());
    }

    public function test_authenticated_user_can_access_me_endpoint(): void
    {
        $role = Role::factory()->instructor()->create();
        $user = User::factory()->create(['role_id' => $role->id]);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/v1/auth/me');

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'message' => 'Authenticated user retrieved successfully',
            'data' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => Role::INSTRUCTOR,
            ],
        ]);
        $response->assertJsonMissingPath('data.password');
    }

    public function test_unauthenticated_user_cannot_access_me_endpoint(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $role = Role::factory()->employee()->create();
        $user = User::factory()->create(['role_id' => $role->id]);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/v1/auth/logout');

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

    public function test_token_is_revoked_after_logout(): void
    {
        $role = Role::factory()->employee()->create();
        $user = User::factory()->create(['role_id' => $role->id]);
        $newToken = $user->createToken('test');

        $this->withToken($newToken->plainTextToken)->postJson('/api/v1/auth/logout')->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $newToken->accessToken->id,
        ]);
    }
}
