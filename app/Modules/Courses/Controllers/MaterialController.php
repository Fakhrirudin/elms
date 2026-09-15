<?php

namespace App\Modules\Courses\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\Module;
use App\Modules\Courses\Requests\ReorderMaterialsRequest;
use App\Modules\Courses\Requests\StoreMaterialRequest;
use App\Modules\Courses\Requests\UpdateMaterialRequest;
use App\Modules\Courses\Resources\MaterialResource;
use App\Modules\Courses\Services\MaterialService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class MaterialController extends Controller
{
    public function __construct(private readonly MaterialService $materialService) {}

    public function index(Module $module): JsonResponse
    {
        $this->authorize('viewAny', [Material::class, $module]);

        $materials = $this->materialService->listForModule($module);

        return ApiResponse::success(
            MaterialResource::collection($materials),
            'Materials retrieved successfully',
        );
    }

    public function store(StoreMaterialRequest $request, Module $module): JsonResponse
    {
        $this->authorize('create', [Material::class, $module]);

        $material = $this->materialService->create(
            $module,
            $request->validated(),
            $request->file('file'),
        );

        return ApiResponse::success(
            new MaterialResource($material),
            'Material created successfully',
            201,
        );
    }

    public function show(Material $material): JsonResponse
    {
        $this->authorize('view', $material);

        return ApiResponse::success(
            new MaterialResource($material),
            'Material retrieved successfully',
        );
    }

    public function update(UpdateMaterialRequest $request, Material $material): JsonResponse
    {
        $this->authorize('update', $material);

        $material = $this->materialService->update(
            $material,
            $request->validated(),
            $request->file('file'),
        );

        return ApiResponse::success(
            new MaterialResource($material),
            'Material updated successfully',
        );
    }

    public function destroy(Material $material): JsonResponse
    {
        $this->authorize('delete', $material);

        $this->materialService->delete($material);

        return ApiResponse::success(
            null,
            'Material deleted successfully',
        );
    }

    public function reorder(ReorderMaterialsRequest $request, Module $module): JsonResponse
    {
        $this->authorize('reorder', [Material::class, $module]);

        $this->materialService->reorder($module, $request->validated('materials'));

        $materials = $this->materialService->listForModule($module);

        return ApiResponse::success(
            MaterialResource::collection($materials),
            'Materials reordered successfully',
        );
    }
}
