<?php

namespace App\Modules\Learning\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Modules\Learning\Requests\IndexMyCoursesRequest;
use App\Modules\Learning\Resources\EnrollmentResource;
use App\Modules\Learning\Services\EnrollmentService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function __construct(private readonly EnrollmentService $enrollmentService) {}

    public function enroll(Request $request, Course $course): JsonResponse
    {
        $this->authorize('enroll', [Enrollment::class, $course]);

        $enrollment = $this->enrollmentService->enroll($request->user(), $course);

        return ApiResponse::success(
            new EnrollmentResource($enrollment),
            'Course enrolled successfully',
            201,
        );
    }

    public function myCourses(IndexMyCoursesRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Enrollment::class);

        $enrollments = $this->enrollmentService->listMyCourses($request->user(), $request->validated());

        return ApiResponse::paginated(
            EnrollmentResource::collection($enrollments),
            $enrollments,
            'Enrolled courses retrieved successfully',
        );
    }

    public function show(Enrollment $enrollment): JsonResponse
    {
        $this->authorize('view', $enrollment);

        $enrollment = $this->enrollmentService->getEnrollment($enrollment);

        return ApiResponse::success(
            new EnrollmentResource($enrollment),
            'Enrollment retrieved successfully',
        );
    }
}
