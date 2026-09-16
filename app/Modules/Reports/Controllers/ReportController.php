<?php

namespace App\Modules\Reports\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reports\Requests\CourseReportRequest;
use App\Modules\Reports\Requests\LearningReportRequest;
use App\Modules\Reports\Requests\QuizReportRequest;
use App\Modules\Reports\Resources\CourseReportResource;
use App\Modules\Reports\Resources\LearningReportResource;
use App\Modules\Reports\Resources\QuizReportResource;
use App\Modules\Reports\Services\ReportService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reportService) {}

    public function courses(CourseReportRequest $request): JsonResponse
    {
        $this->authorize('viewCourseReport');

        $reports = $this->reportService->getCourseReport($request->user(), $request->validated());

        return ApiResponse::paginated(
            CourseReportResource::collection($reports),
            $reports,
            'Course report retrieved successfully',
        );
    }

    public function learning(LearningReportRequest $request): JsonResponse
    {
        $this->authorize('viewLearningReport');

        $reports = $this->reportService->getLearningReport($request->user(), $request->validated());

        return ApiResponse::paginated(
            LearningReportResource::collection($reports),
            $reports,
            'Learning report retrieved successfully',
        );
    }

    public function quiz(QuizReportRequest $request): JsonResponse
    {
        $this->authorize('viewQuizReport');

        $reports = $this->reportService->getQuizReport($request->user(), $request->validated());

        return ApiResponse::paginated(
            QuizReportResource::collection($reports),
            $reports,
            'Quiz report retrieved successfully',
        );
    }
}

