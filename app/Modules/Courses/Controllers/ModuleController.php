<?php

namespace App\Modules\Courses\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Module;
use App\Modules\Courses\Requests\ReorderModulesRequest;
use App\Modules\Courses\Requests\StoreModuleRequest;
use App\Modules\Courses\Requests\UpdateModuleRequest;
use App\Modules\Courses\Resources\ModuleResource;
use App\Modules\Courses\Services\ModuleService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class ModuleController extends Controller
{
    public function __construct(private readonly ModuleService $moduleService) {}

    public function index(Course $course): JsonResponse
    {
        $this->authorize('viewAny', [Module::class, $course]);

        $modules = $this->moduleService->listForCourse($course);

        return ApiResponse::success(
            ModuleResource::collection($modules),
            'Modules retrieved successfully',
        );
    }

    public function store(StoreModuleRequest $request, Course $course): JsonResponse
    {
        $this->authorize('create', [Module::class, $course]);

        $module = $this->moduleService->create($course, $request->validated());

        return ApiResponse::success(
            new ModuleResource($module),
            'Module created successfully',
            201,
        );
    }

    public function show(Module $module): JsonResponse
    {
        $this->authorize('view', $module);

        return ApiResponse::success(
            new ModuleResource($module->load('materials')),
            'Module retrieved successfully',
        );
    }

    public function update(UpdateModuleRequest $request, Module $module): JsonResponse
    {
        $this->authorize('update', $module);

        $module = $this->moduleService->update($module, $request->validated());

        return ApiResponse::success(
            new ModuleResource($module),
            'Module updated successfully',
        );
    }

    public function destroy(Module $module): JsonResponse
    {
        $this->authorize('delete', $module);

        $this->moduleService->delete($module);

        return ApiResponse::success(
            null,
            'Module deleted successfully',
        );
    }

    public function reorder(ReorderModulesRequest $request, Course $course): JsonResponse
    {
        $this->authorize('reorder', [Module::class, $course]);

        $this->moduleService->reorder($course, $request->validated('modules'));

        $modules = $this->moduleService->listForCourse($course);

        return ApiResponse::success(
            ModuleResource::collection($modules),
            'Modules reordered successfully',
        );
    }
}
