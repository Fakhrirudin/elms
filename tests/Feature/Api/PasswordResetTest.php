<?php

namespace Tests\Feature\Api;

use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_email_accepts_forgot_password_request(): void
    {
        Notification::fake();

        $role = Role::factory()->employee()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email' => 'learner@elms.test',
        ]);

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'learner@elms.test',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'message' => 'If the account exists, a password reset link has been sent.',
        ]);

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_non_existing_email_does_not_reveal_account_existence(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'nonexistent@elms.test',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'message' => 'If the account exists, a password reset link has been sent.',
        ]);

        Notification::assertNothingSent();
    }

    public function test_reset_email_is_generated_with_expected_frontend_url(): void
    {
        Notification::fake();

        $role = Role::factory()->employee()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email' => 'urltest@elms.test',
        ]);

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'urltest@elms.test',
        ])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user) {
            $mail = $notification->toMail($user);
            $actionUrl = $mail->actionUrl;

            return str_contains($actionUrl, '/reset-password?token=') &&
                   str_contains($actionUrl, 'email='.urlencode($user->email));
        });
    }

    public function test_forgot_password_response_format_matches_expected_api_convention(): void
    {
        $role = Role::factory()->employee()->create();
        User::factory()->create([
            'role_id' => $role->id,
            'email' => 'convention@elms.test',
        ]);

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'convention@elms.test',
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data',
        ]);
        $this->assertTrue($response->json('success'));
    }

    public function test_valid_token_resets_password(): void
    {
        $role = Role::factory()->employee()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email' => 'validreset@elms.test',
            'password' => 'OldPassword123!',
        ]);

        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'validreset@elms.test',
            'password' => 'NewSecret123!',
            'password_confirmation' => 'NewSecret123!',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'message' => 'Password has been reset successfully.',
        ]);

        $user->refresh();
        $this->assertTrue(Hash::check('NewSecret123!', $user->password));
    }

    public function test_invalid_token_rejected(): void
    {
        $role = Role::factory()->employee()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email' => 'invalidtoken@elms.test',
            'password' => 'OldPassword123!',
        ]);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'invalid-random-token',
            'email' => 'invalidtoken@elms.test',
            'password' => 'NewSecret123!',
            'password_confirmation' => 'NewSecret123!',
        ]);

        $response->assertStatus(400);
        $response->assertJson(['success' => false]);

        $user->refresh();
        $this->assertTrue(Hash::check('OldPassword123!', $user->password));
    }

    public function test_expired_token_rejected(): void
    {
        $role = Role::factory()->employee()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email' => 'expiredtoken@elms.test',
            'password' => 'OldPassword123!',
        ]);

        $token = Password::broker()->createToken($user);

        // Tokens expire after 60 minutes by default
        $this->travel(65)->minutes();

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'expiredtoken@elms.test',
            'password' => 'NewSecret123!',
            'password_confirmation' => 'NewSecret123!',
        ]);

        $response->assertStatus(400);
        $response->assertJson(['success' => false]);

        $user->refresh();
        $this->assertTrue(Hash::check('OldPassword123!', $user->password));
    }

    public function test_wrong_email_token_combination_rejected(): void
    {
        $role = Role::factory()->employee()->create();
        $userA = User::factory()->create(['role_id' => $role->id, 'email' => 'usera@elms.test']);
        $userB = User::factory()->create(['role_id' => $role->id, 'email' => 'userb@elms.test']);

        $tokenA = Password::broker()->createToken($userA);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $tokenA,
            'email' => 'userb@elms.test',
            'password' => 'NewSecret123!',
            'password_confirmation' => 'NewSecret123!',
        ]);

        $response->assertStatus(400);
        $response->assertJson(['success' => false]);
    }

    public function test_password_mismatch_rejected(): void
    {
        $role = Role::factory()->employee()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email' => 'mismatch@elms.test',
        ]);

        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'mismatch@elms.test',
            'password' => 'NewSecret123!',
            'password_confirmation' => 'Different123!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_weak_or_invalid_password_rejected(): void
    {
        $role = Role::factory()->employee()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email' => 'weakpass@elms.test',
        ]);

        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'weakpass@elms.test',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_reset_token_cannot_be_reused_successfully(): void
    {
        $role = Role::factory()->employee()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email' => 'reuse@elms.test',
            'password' => 'InitialPassword123!',
        ]);

        $token = Password::broker()->createToken($user);

        // First reset with the token
        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'reuse@elms.test',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        // Second reset with the same token must fail
        $secondAttempt = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'reuse@elms.test',
            'password' => 'AnotherPassword123!',
            'password_confirmation' => 'AnotherPassword123!',
        ]);

        $secondAttempt->assertStatus(400);
        $secondAttempt->assertJson(['success' => false]);
    }

    public function test_user_can_login_with_new_password_and_old_password_fails(): void
    {
        $role = Role::factory()->employee()->create();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email' => 'loginflow@elms.test',
            'password' => 'OldPassword123!',
        ]);

        $token = Password::broker()->createToken($user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'loginflow@elms.test',
            'password' => 'NewSecretPassword123!',
            'password_confirmation' => 'NewSecretPassword123!',
        ])->assertOk();

        // Old password fails
        $this->postJson('/api/v1/auth/login', [
            'email' => 'loginflow@elms.test',
            'password' => 'OldPassword123!',
        ])->assertStatus(401);

        // New password succeeds
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'loginflow@elms.test',
            'password' => 'NewSecretPassword123!',
        ]);

        $loginResponse->assertOk();
        $loginResponse->assertJson(['success' => true]);
        $this->assertNotEmpty($loginResponse->json('data.token'));
    }

    public function test_existing_login_still_works(): void
    {
        $role = Role::factory()->employee()->create();
        User::factory()->create([
            'role_id' => $role->id,
            'email' => 'regression@elms.test',
            'password' => 'Password123!',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'regression@elms.test',
            'password' => 'Password123!',
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true, 'message' => 'Login successful']);
    }

    public function test_existing_logout_still_works(): void
    {
        $role = Role::factory()->employee()->create();
        $user = User::factory()->create(['role_id' => $role->id]);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/v1/auth/logout');

        $response->assertOk();
        $response->assertJson(['success' => true, 'message' => 'Logout successful']);
    }

    public function test_existing_auth_me_still_works(): void
    {
        $role = Role::factory()->employee()->create();
        $user = User::factory()->create(['role_id' => $role->id]);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/v1/auth/me');

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'email' => $user->email,
            ],
        ]);
    }
}
