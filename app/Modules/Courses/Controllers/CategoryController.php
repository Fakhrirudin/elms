<?php

namespace App\Modules\Courses\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Modules\Courses\Exceptions\CategoryInUseException;
use App\Modules\Courses\Requests\StoreCategoryRequest;
use App\Modules\Courses\Requests\UpdateCategoryRequest;
use App\Modules\Courses\Resources\CategoryResource;
use App\Modules\Courses\Services\CategoryService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function __construct(private readonly CategoryService $categoryService) {}

    public function index(): JsonResponse
    {
        $categories = $this->categoryService->list();

        return ApiResponse::success(
            CategoryResource::collection($categories),
            'Categories retrieved successfully',
        );
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $this->categoryService->create($request->validated());

        return ApiResponse::success(
            new CategoryResource($category),
            'Category created successfully',
            201,
        );
    }

    public function show(Category $category): JsonResponse
    {
        return ApiResponse::success(
            new CategoryResource($category),
            'Category retrieved successfully',
        );
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $category = $this->categoryService->update($category, $request->validated());

        return ApiResponse::success(
            new CategoryResource($category),
            'Category updated successfully',
        );
    }

    public function destroy(Category $category): JsonResponse
    {
        try {
            $this->categoryService->delete($category);
        } catch (CategoryInUseException $exception) {
            return ApiResponse::error($exception->getMessage(), null, 422);
        }

        return ApiResponse::success(
            null,
            'Category deleted successfully',
        );
    }
}
