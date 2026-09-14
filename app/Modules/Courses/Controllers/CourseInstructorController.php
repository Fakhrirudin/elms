<?php

namespace App\Modules\Courses\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use App\Modules\Courses\Requests\AssignInstructorRequest;
use App\Modules\Courses\Requests\SyncInstructorsRequest;
use App\Modules\Courses\Resources\CourseInstructorResource;
use App\Modules\Courses\Services\CourseService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class CourseInstructorController extends Controller
{
    public function __construct(private readonly CourseService $courseService) {}

    public function index(Course $course): JsonResponse
    {
        $this->authorize('view', $course);

        return ApiResponse::success(
            CourseInstructorResource::collection($course->instructors),
            'Course instructors retrieved successfully',
        );
    }

    public function store(AssignInstructorRequest $request, Course $course): JsonResponse
    {
        $this->authorize('manageInstructors', $course);

        $course = $this->courseService->assignInstructor($course, (int) $request->validated('user_id'));

        return ApiResponse::success(
            CourseInstructorResource::collection($course->instructors),
            'Instructor assigned successfully',
            201,
        );
    }

    public function sync(SyncInstructorsRequest $request, Course $course): JsonResponse
    {
        $this->authorize('manageInstructors', $course);

        $course = $this->courseService->syncInstructors($course, $request->instructorIds());

        return ApiResponse::success(
            CourseInstructorResource::collection($course->instructors),
            'Instructors updated successfully',
        );
    }

    public function destroy(Course $course, User $user): JsonResponse
    {
        $this->authorize('manageInstructors', $course);

        $course = $this->courseService->removeInstructor($course, $user->id);

        return ApiResponse::success(
            CourseInstructorResource::collection($course->instructors),
            'Instructor removed successfully',
        );
    }
}
