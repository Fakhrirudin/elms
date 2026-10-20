<?php

namespace App\Modules\Learning\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Material;
use App\Modules\Learning\Resources\LearningProgressResource;
use App\Modules\Learning\Resources\MaterialCompletionResource;
use App\Modules\Learning\Services\CourseCompletionService;
use App\Modules\Learning\Services\LearningProgressService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class LearningProgressController extends Controller
{
    public function __construct(
        private readonly LearningProgressService $progressService,
        private readonly CourseCompletionService $courseCompletionService
    ) {}

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

    public function learningOverview(Enrollment $enrollment): JsonResponse
    {
        $this->authorize('viewProgress', $enrollment);

        $data = $this->courseCompletionService->getLearningOverview($enrollment);

        return ApiResponse::success(
            $data,
            'Learning overview retrieved successfully',
        );
    }

    public function currentActivity(Enrollment $enrollment): JsonResponse
    {
        $this->authorize('viewProgress', $enrollment);

        $activity = $this->courseCompletionService->getCurrentActivity($enrollment);

        return ApiResponse::success(
            [
                'current_activity' => $activity,
                'last_activity' => [
                    'type' => $enrollment->last_activity_type,
                    'id' => $enrollment->last_activity_id,
                    'accessed_at' => $enrollment->last_accessed_at?->toISOString(),
                ],
            ],
            'Current activity retrieved successfully',
        );
    }

    public function updateCurrentActivity(Request $request, Enrollment $enrollment): JsonResponse
    {
        $this->authorize('updateActivity', $enrollment);

        $validated = $request->validate([
            'activity_type' => ['required', 'string', 'in:MATERIAL,QUIZ,ASSIGNMENT'],
            'activity_id' => ['required', 'integer'],
        ]);

        $this->courseCompletionService->updateLastActivity(
            $enrollment,
            $validated['activity_type'],
            (int) $validated['activity_id']
        );

        return ApiResponse::success(
            null,
            'Current activity updated successfully',
        );
    }

    public function recalculate(Enrollment $enrollment): JsonResponse
    {
        $this->authorize('recalculateProgress', $enrollment);

        $this->courseCompletionService->updateCompletionStatus($enrollment);
        $data = $this->courseCompletionService->getLearningOverview($enrollment);

        return ApiResponse::success(
            $data,
            'Progress recalculated successfully',
        );
    }

    public function streamMaterialFile(Enrollment $enrollment, Material $material): Response
    {
        $this->authorize('viewMaterialFile', [$enrollment, $material]);

        if ($material->type !== Material::TYPE_PDF || empty($material->file_path)) {
            abort(404, 'PDF material file not found.');
        }

        $filePath = $material->file_path;
        if (Storage::disk('local')->exists($filePath)) {
            return Storage::disk('local')->response(
                $filePath,
                basename($filePath),
                [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="'.basename($filePath).'"',
                ]
            );
        }

        $legacyPath = storage_path('app/'.$filePath);
        if (file_exists($legacyPath)) {
            return response()->file($legacyPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.basename($filePath).'"',
            ]);
        }

        abort(404, 'Material document file not found on storage.');
    }
}
