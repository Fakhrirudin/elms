<?php

namespace App\Modules\Learning\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class EnrollmentService
{
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

        return $enrollment->load(['course.category', 'course.instructors']);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listMyCourses(User $user, array $filters): LengthAwarePaginator
    {
        $perPage = min((int) ($filters['per_page'] ?? 10), 100);

        return $user->enrollments()
            ->with(['course.category', 'course.instructors'])
            ->when($filters['status'] ?? null, function ($query, $status) {
                $query->where('status', $status);
            })
            ->latest('enrolled_at')
            ->paginate($perPage);
    }

    public function getEnrollment(Enrollment $enrollment): Enrollment
    {
        return $enrollment->load(['course.category', 'course.instructors', 'user']);
    }
}
