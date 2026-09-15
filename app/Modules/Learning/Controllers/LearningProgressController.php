<?php

namespace App\Modules\Learning\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Material;
use App\Modules\Learning\Resources\LearningProgressResource;
use App\Modules\Learning\Resources\MaterialCompletionResource;
use App\Modules\Learning\Services\LearningProgressService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class LearningProgressController extends Controller
{
    public function __construct(private readonly LearningProgressService $progressService) {}

    public function progress(Enrollment $enrollment): JsonResponse
    {
        $this->authorize('viewProgress', $enrollment);

        $data = $this->progressService->getProgress($enrollment);

        return ApiResponse::success(
            new LearningProgressResource($data),
            'Learning progress retrieved successfully',
        );
    }

    public function complete(Enrollment $enrollment, Material $material): JsonResponse
    {
        $this->authorize('completeMaterial', $enrollment);

        $data = $this->progressService->completeMaterial($enrollment, $material);

        return ApiResponse::success(
            new MaterialCompletionResource($data),
            'Material marked as completed',
        );
    }
}

