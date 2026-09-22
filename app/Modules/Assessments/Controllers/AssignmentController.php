<?php

namespace App\Modules\Assessments\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Module;
use App\Models\Role;
use App\Modules\Assessments\Requests\StoreAssignmentRequest;
use App\Modules\Assessments\Requests\UpdateAssignmentRequest;
use App\Modules\Assessments\Resources\AssignmentResource;
use App\Modules\Assessments\Services\AssignmentService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    public function __construct(
        private readonly AssignmentService $assignmentService,
    ) {}

    public function index(Request $request, Module $module): JsonResponse
    {
        $user = $request->user();
        $isLearner = $user && $user->hasRole(Role::EMPLOYEE);

        $query = $module->assignments()
            ->withCount('submissions')
            ->orderBy('id');

        if ($isLearner) {
            $query->where('status', Assignment::STATUS_PUBLISHED);
        }

        $assignments = $query->get();

        return ApiResponse::success(
            AssignmentResource::collection($assignments),
            'Assignments retrieved successfully'
        );
    }

    public function store(StoreAssignmentRequest $request, Module $module): JsonResponse
    {
        $this->authorize('create', [Assignment::class, $module]);

        $assignment = $this->assignmentService->create($module, $request->user(), $request->validated());

        return ApiResponse::success(
            new AssignmentResource($assignment->loadCount('submissions')),
            'Assignment created successfully',
            201
        );
    }

    public function show(Assignment $assignment): JsonResponse
    {
        $this->authorize('view', $assignment);

        $assignment->loadMissing(['module.course', 'submissions.reviewer'])
            ->loadCount('submissions');

        return ApiResponse::success(
            new AssignmentResource($assignment),
            'Assignment retrieved successfully'
        );
    }

    public function update(UpdateAssignmentRequest $request, Assignment $assignment): JsonResponse
    {
        $this->authorize('update', $assignment);

        $assignment = $this->assignmentService->update($assignment, $request->validated());

        return ApiResponse::success(
            new AssignmentResource($assignment->loadCount('submissions')),
            'Assignment updated successfully'
        );
    }

    public function destroy(Assignment $assignment): JsonResponse
    {
        $this->authorize('delete', $assignment);

        $this->assignmentService->delete($assignment);

        return ApiResponse::success(
            null,
            'Assignment deleted successfully'
        );
    }

    public function publish(Assignment $assignment): JsonResponse
    {
        $this->authorize('publish', $assignment);

        $assignment = $this->assignmentService->publish($assignment);

        return ApiResponse::success(
            new AssignmentResource($assignment->loadCount('submissions')),
            'Assignment published successfully'
        );
    }

    public function close(Assignment $assignment): JsonResponse
    {
        $this->authorize('close', $assignment);

        $assignment = $this->assignmentService->close($assignment);

        return ApiResponse::success(
            new AssignmentResource($assignment->loadCount('submissions')),
            'Assignment closed successfully'
        );
    }
}
