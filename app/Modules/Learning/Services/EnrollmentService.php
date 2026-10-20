<?php

namespace App\Modules\Learning\Services;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\Quiz;
use App\Models\User;
use App\Modules\Notifications\Services\NotificationService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class EnrollmentService
{
    public function __construct(
        protected ?NotificationService $notificationService = null,
        protected ?CourseCompletionService $courseCompletionService = null
    ) {
        $this->courseCompletionService = $courseCompletionService ?? app(CourseCompletionService::class);
    }

    /**
     * @throws ValidationException
     */
    public function enroll(User $user, Course $course): Enrollment
    {
        if ($user->enrollments()->where('course_id', $course->id)->exists()) {
            throw ValidationException::withMessages([
                'course' => ['You are already enrolled in this course.'],
            ]);
        }

        $enrollment = $user->enrollments()->create([
            'course_id' => $course->id,
            'status' => Enrollment::STATUS_ENROLLED,
            'enrolled_at' => now(),
        ]);

        ($this->notificationService ?? app(NotificationService::class))->notifyCourseEnrolled($enrollment);

        return $enrollment->load(['course.category', 'course.instructors']);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listMyCourses(User $user, array $filters): LengthAwarePaginator
    {
        $perPage = min((int) ($filters['per_page'] ?? 10), 100);

        $paginator = $user->enrollments()
            ->with(['course.category', 'course.instructors'])
            ->when($filters['status'] ?? null, function ($query, $status) {
                $query->where('status', $status);
            })
            ->latest('enrolled_at')
            ->paginate($perPage);

        foreach ($paginator->items() as $enrollment) {
            $progressCalc = $this->courseCompletionService->calculateCourseProgress($enrollment);

            $lastActivityTitle = null;
            if ($enrollment->last_activity_type && $enrollment->last_activity_id) {
                if ($enrollment->last_activity_type === 'MATERIAL') {
                    $lastActivityTitle = Material::where('id', $enrollment->last_activity_id)->value('title');
                } elseif ($enrollment->last_activity_type === 'QUIZ') {
                    $lastActivityTitle = Quiz::where('id', $enrollment->last_activity_id)->value('title');
                } elseif ($enrollment->last_activity_type === 'ASSIGNMENT') {
                    $lastActivityTitle = Assignment::where('id', $enrollment->last_activity_id)->value('title');
                }
            }

            $enrollment->progress_data = [
                'percentage' => $progressCalc['overall_percentage'],
                'total_required' => $progressCalc['total_required_activities'],
                'completed_required' => $progressCalc['completed_required_activities'],
                'completed_modules' => $progressCalc['modules_summary']['completed_modules'],
                'total_modules' => $progressCalc['modules_summary']['total_modules'],
                'last_activity' => $enrollment->last_activity_type ? [
                    'type' => $enrollment->last_activity_type,
                    'id' => $enrollment->last_activity_id,
                    'title' => $lastActivityTitle,
                    'accessed_at' => $enrollment->last_accessed_at?->toISOString(),
                ] : null,
            ];
        }

        return $paginator;
    }

    public function getEnrollment(Enrollment $enrollment): Enrollment
    {
        return $enrollment->load(['course.category', 'course.instructors', 'user']);
    }
}
