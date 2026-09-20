<?php

namespace App\Modules\Authentication\Services;

use App\Models\Role;
use App\Models\User;
use App\Modules\Authentication\Exceptions\AuthenticationFailedException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthenticationService
{
    /**
     * Validate credentials and issue a Sanctum token for the user.
     *
     * @return array{user: User, token: string}
     *
     * @throws AuthenticationFailedException
     */
    public function login(string $email, string $password): array
    {
        $user = User::query()->with('role')->where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw new AuthenticationFailedException('These credentials do not match our records.');
        }

        if (! $user->is_active) {
            throw new AuthenticationFailedException('Your account has been deactivated. Please contact your administrator.');
        }

        return [
            'user' => $user,
            'token' => $user->createToken('api')->plainTextToken,
        ];
    }

    /**
     * Revoke the token used to authenticate the current request.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }

    /**
     * Register a new employee user account and issue an initial Sanctum token.
     * Enforces the EMPLOYEE role server-side regardless of input.
     *
     * @param  array{name: string, email: string, password: string, department_id: int}  $data
     * @return array{user: User, token: string}
     */
    public function register(array $data): array
    {
        $employeeRole = Role::query()->where('name', Role::EMPLOYEE)->firstOrFail();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'department_id' => $data['department_id'],
            'role_id' => $employeeRole->id,
            'is_active' => true,
        ]);

        $user->load(['role', 'department']);

        return [
            'user' => $user,
            'token' => $user->createToken('api')->plainTextToken,
        ];
    }

    /**
     * Send password reset link to user email via Laravel's native password broker.
     */
    public function sendResetLink(string $email): void
    {
        Password::broker()->sendResetLink(['email' => $email]);
    }

    /**
     * Reset user password using Laravel's native password broker.
     * Revokes all active Sanctum tokens upon successful reset.
     *
     * @param  array{email: string, password: string, password_confirmation: string, token: string}  $credentials
     */
    public function resetPassword(array $credentials): string
    {
        return Password::broker()->reset(
            $credentials,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                // Revoke all existing Sanctum tokens for security
                $user->tokens()->delete();
            }
        );
    }
}
