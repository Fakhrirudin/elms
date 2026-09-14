<?php

namespace App\Modules\Courses\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Modules\Courses\Requests\IndexCourseRequest;
use App\Modules\Courses\Requests\StoreCourseRequest;
use App\Modules\Courses\Requests\UpdateCourseRequest;
use App\Modules\Courses\Requests\UpdateCourseStatusRequest;
use App\Modules\Courses\Resources\CourseResource;
use App\Modules\Courses\Services\CourseService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class CourseController extends Controller
{
    public function __construct(private readonly CourseService $courseService) {}

    public function index(IndexCourseRequest $request): JsonResponse
    {
        $courses = $this->courseService->paginate($request->user(), $request->validated());

        return ApiResponse::paginated(
            CourseResource::collection($courses),
            $courses,
            'Courses retrieved successfully',
        );
    }

    public function store(StoreCourseRequest $request): JsonResponse
    {
        $this->authorize('create', Course::class);

        $course = $this->courseService->create($request->user(), $request->validated());

        return ApiResponse::success(
            new CourseResource($course->load(['category', 'instructors'])),
            'Course created successfully',
            201,
        );
    }

    public function show(Course $course): JsonResponse
    {
        $this->authorize('view', $course);

        return ApiResponse::success(
            new CourseResource($course->load(['category', 'instructors'])),
            'Course retrieved successfully',
        );
    }

    public function update(UpdateCourseRequest $request, Course $course): JsonResponse
    {
        $this->authorize('update', $course);

        $course = $this->courseService->update($course, $request->validated());

        return ApiResponse::success(
            new CourseResource($course->load(['category', 'instructors'])),
            'Course updated successfully',
        );
    }

    public function destroy(Course $course): JsonResponse
    {
        $this->authorize('delete', $course);

        $this->courseService->delete($course);

        return ApiResponse::success(
            null,
            'Course deleted successfully',
        );
    }

    public function updateStatus(UpdateCourseStatusRequest $request, Course $course): JsonResponse
    {
        $this->authorize('updateStatus', $course);

        $course = $this->courseService->updateStatus($course, $request->validated('status'));

        return ApiResponse::success(
            new CourseResource($course->load(['category', 'instructors'])),
            'Course status updated successfully',
        );
    }
}
