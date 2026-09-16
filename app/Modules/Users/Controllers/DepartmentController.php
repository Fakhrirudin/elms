<?php

namespace App\Modules\Users\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Modules\Users\Requests\StoreDepartmentRequest;
use App\Modules\Users\Requests\UpdateDepartmentRequest;
use App\Modules\Users\Resources\DepartmentResource;
use App\Modules\Users\Services\DepartmentService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function __construct(
        protected DepartmentService $departmentService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Department::class);

        $paginator = $this->departmentService->listDepartments($request->all());

        return ApiResponse::paginated(
            DepartmentResource::collection($paginator->items()),
            $paginator,
            'Departments retrieved successfully'
        );
    }

    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $this->authorize('create', Department::class);

        $department = $this->departmentService->createDepartment($request->validated());

        return ApiResponse::success(
            new DepartmentResource($department),
            'Department created successfully',
            201
        );
    }

    public function show(Department $department): JsonResponse
    {
        $this->authorize('view', $department);

        $loaded = $this->departmentService->getDepartment($department);

        return ApiResponse::success(
            new DepartmentResource($loaded),
            'Department retrieved successfully'
        );
    }

    public function update(UpdateDepartmentRequest $request, Department $department): JsonResponse
    {
        $this->authorize('update', $department);

        $updated = $this->departmentService->updateDepartment($department, $request->validated());

        return ApiResponse::success(
            new DepartmentResource($updated),
            'Department updated successfully'
        );
    }

    public function destroy(Request $request, Department $department): JsonResponse
    {
        $this->authorize('delete', $department);

        $this->departmentService->deleteDepartment($department);

        return ApiResponse::success(
            null,
            'Department deleted successfully'
        );
    }
}
