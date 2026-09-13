<?php

namespace App\Modules\Authentication\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Authentication\Exceptions\AuthenticationFailedException;
use App\Modules\Authentication\Requests\LoginRequest;
use App\Modules\Authentication\Resources\AuthenticatedUserResource;
use App\Modules\Authentication\Services\AuthenticationService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
