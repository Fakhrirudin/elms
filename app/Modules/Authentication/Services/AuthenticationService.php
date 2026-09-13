<?php

namespace App\Modules\Authentication\Services;

use App\Models\User;
use App\Modules\Authentication\Exceptions\AuthenticationFailedException;
use Illuminate\Support\Facades\Hash;

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
}
