<?php

namespace App\Modules\Users\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Users\Exceptions\UserAuthorizationException;
use App\Modules\Users\Requests\IndexUserRequest;
use App\Modules\Users\Requests\StoreUserRequest;
use App\Modules\Users\Requests\UpdateUserRequest;
use App\Modules\Users\Requests\UpdateUserStatusRequest;
use App\Modules\Users\Resources\UserResource;
use App\Modules\Users\Services\UserService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function __construct(private readonly UserService $userService) {}

    public function index(IndexUserRequest $request): JsonResponse
    {
        $users = $this->userService->paginate($request->validated());

        return ApiResponse::paginated(
            UserResource::collection($users),
            $users,
            'Users retrieved successfully',
        );
    }

    public function show(User $user): JsonResponse
    {
        return ApiResponse::success(
            new UserResource($user->load(['role', 'department'])),
            'User retrieved successfully',
        );
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        try {
            $user = $this->userService->create($request->user(), $request->validated());
        } catch (UserAuthorizationException $exception) {
            return ApiResponse::error($exception->getMessage(), null, 403);
        }

        return ApiResponse::success(
            new UserResource($user->load(['role', 'department'])),
            'User created successfully',
            201,
        );
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        try {
            $user = $this->userService->update($request->user(), $user, $request->validated());
        } catch (UserAuthorizationException $exception) {
            return ApiResponse::error($exception->getMessage(), null, 403);
        }

        return ApiResponse::success(
            new UserResource($user->load(['role', 'department'])),
            'User updated successfully',
        );
    }

    public function updateStatus(UpdateUserStatusRequest $request, User $user): JsonResponse
    {
        $this->authorize('updateStatus', $user);

        $user = $this->userService->updateStatus($user, $request->boolean('is_active'));

        return ApiResponse::success(
            new UserResource($user->load(['role', 'department'])),
            'User status updated successfully',
        );
    }
}
