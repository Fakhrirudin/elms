<?php

namespace App\Modules\Authentication\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Modules\Authentication\Exceptions\AuthenticationFailedException;
use App\Modules\Authentication\Requests\ForgotPasswordRequest;
use App\Modules\Authentication\Requests\LoginRequest;
use App\Modules\Authentication\Requests\RegisterRequest;
use App\Modules\Authentication\Requests\ResetPasswordRequest;
use App\Modules\Authentication\Resources\AuthenticatedUserResource;
use App\Modules\Authentication\Services\AuthenticationService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class AuthenticationController extends Controller
{
    public function __construct(private readonly AuthenticationService $authenticationService) {}

    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authenticationService->login(...$request->validated());
        } catch (AuthenticationFailedException $exception) {
            return ApiResponse::error($exception->getMessage(), null, 401);
        }

        return ApiResponse::success([
            'user' => new AuthenticatedUserResource($result['user']),
            'token' => $result['token'],
        ], 'Login successful');
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authenticationService->register($request->validated());

        return ApiResponse::success([
            'user' => new AuthenticatedUserResource($result['user']),
            'token' => $result['token'],
        ], 'Registration successful', 201);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $this->authenticationService->sendResetLink($request->validated('email'));

        return ApiResponse::success(
            null,
            'If the account exists, a password reset link has been sent.'
        );
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = $this->authenticationService->resetPassword($request->validated());

        if ($status === Password::PASSWORD_RESET) {
            return ApiResponse::success(null, 'Password has been reset successfully.');
        }

        return ApiResponse::error(
            trans($status) ?: 'Invalid password reset token.',
            null,
            400
        );
    }

    public function departments(): JsonResponse
    {
        $departments = Department::query()->select(['id', 'name'])->orderBy('name')->get();

        return ApiResponse::success($departments, 'Departments retrieved successfully');
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authenticationService->logout($request->user());

        return ApiResponse::success(null, 'Logout successful');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['role', 'department']);

        return ApiResponse::success(new AuthenticatedUserResource($user), 'Authenticated user retrieved successfully');
    }
}
