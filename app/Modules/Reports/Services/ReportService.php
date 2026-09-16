<?php

namespace App\Modules\Reports\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Role;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ReportService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function getCourseReport(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = Course::query()->with('category');

        if ($user->hasRole(Role::INSTRUCTOR) && ! $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN)) {
            $query->whereHas('instructors', fn ($q) => $q->where('users.id', $user->id));
        }

        if (! empty($filters['course_id'])) {
            $query->where('id', $filters['course_id']);
        }
        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $perPage = (int) ($filters['per_page'] ?? 15);
        $paginated = $query->paginate($perPage);

        $items = $paginated->getCollection()->map(function (Course $course) {
            $enrollments = $course->enrollments();
            $total = (clone $enrollments)->count();
            $inProgress = (clone $enrollments)->whereIn('status', [Enrollment::STATUS_ENROLLED, Enrollment::STATUS_IN_PROGRESS])->count();
            $completed = (clone $enrollments)->where('status', Enrollment::STATUS_COMPLETED)->count();
            $completionRate = $total > 0 ? round(($completed / $total) * 100, 2) : 0.0;

            return [
                'course_id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'status' => $course->status,
                'category' => $course->category ? [
                    'id' => $course->category->id,
                    'name' => $course->category->name,
                ] : null,
                'total_enrollments' => $total,
                'in_progress_count' => $inProgress,
                'completed_count' => $completed,
                'completion_rate' => $completionRate,
            ];
        });

        $paginated->setCollection($items);

        return $paginated;
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function getLearningReport(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = Enrollment::query()->with(['user.department', 'course']);

        if ($user->hasRole(Role::EMPLOYEE)) {
            $query->where('user_id', $user->id);
        } elseif ($user->hasRole(Role::INSTRUCTOR) && ! $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN)) {
            $query->whereHas('course.instructors', fn ($q) => $q->where('users.id', $user->id));
        }

        if (! empty($filters['course_id'])) {
            $query->where('course_id', $filters['course_id']);
        }
        if (! empty($filters['department_id'])) {
            $query->whereHas('user', fn ($q) => $q->where('department_id', $filters['department_id']));
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['user_id']) && ! $user->hasRole(Role::EMPLOYEE)) {
            $query->where('user_id', $filters['user_id']);
        }

        $perPage = (int) ($filters['per_page'] ?? 15);
        $paginated = $query->latest('enrolled_at')->paginate($perPage);

        $items = $paginated->getCollection()->map(function (Enrollment $enrollment) {
            $courseId = $enrollment->course_id;
            $mandatoryMaterialIds = Material::query()
                ->whereHas('module', fn ($q) => $q->where('course_id', $courseId))
                ->where('is_mandatory', true)
                ->pluck('id');

            $totalMandatory = $mandatoryMaterialIds->count();
            $completedMandatory = $totalMandatory > 0
                ? $enrollment->materialProgress()->whereIn('material_id', $mandatoryMaterialIds)->count()
                : 0;

            $progress = $totalMandatory > 0
                ? (int) round(($completedMandatory / $totalMandatory) * 100)
                : ($enrollment->status === Enrollment::STATUS_COMPLETED ? 100 : 0);

            return [
                'enrollment_id' => $enrollment->id,
                'user_id' => $enrollment->user?->id,
                'employee_name' => $enrollment->user?->name,
                'nip' => $enrollment->user?->nip,
                'department' => $enrollment->user?->department?->name,
                'course_id' => $enrollment->course?->id,
                'course_title' => $enrollment->course?->title,
                'status' => $enrollment->status,
                'progress' => $progress,
                'enrolled_at' => $enrollment->enrolled_at?->toISOString(),
                'completed_at' => $enrollment->completed_at?->toISOString(),
            ];
        });

        $paginated->setCollection($items);

        return $paginated;
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function getQuizReport(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = Quiz::query()->with('module.course');

        if ($user->hasRole(Role::INSTRUCTOR) && ! $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN)) {
            $query->whereHas('module.course.instructors', fn ($q) => $q->where('users.id', $user->id));
        }

        if (! empty($filters['quiz_id'])) {
            $query->where('id', $filters['quiz_id']);
        }
        if (! empty($filters['course_id'])) {
            $query->whereHas('module', fn ($q) => $q->where('course_id', $filters['course_id']));
        }

        $perPage = (int) ($filters['per_page'] ?? 15);
        $paginated = $query->paginate($perPage);

        $items = $paginated->getCollection()->map(function (Quiz $quiz) {
            $attemptsQuery = QuizAttempt::query()
                ->where('quiz_id', $quiz->id)
                ->whereNotNull('submitted_at');

            $totalAttempts = (clone $attemptsQuery)->count();
            $totalPassed = (clone $attemptsQuery)->where('passed', true)->count();
            $totalFailed = (clone $attemptsQuery)->where('passed', false)->count();

            $passRate = $totalAttempts > 0 ? round(($totalPassed / $totalAttempts) * 100, 2) : 0.0;
            $avgScore = $totalAttempts > 0 ? round((float) (clone $attemptsQuery)->avg('score'), 2) : 0.0;
            $minScore = $totalAttempts > 0 ? round((float) (clone $attemptsQuery)->min('score'), 2) : 0.0;
            $maxScore = $totalAttempts > 0 ? round((float) (clone $attemptsQuery)->max('score'), 2) : 0.0;

            return [
                'quiz_id' => $quiz->id,
                'quiz_title' => $quiz->title,
                'course_id' => $quiz->module?->course?->id,
                'course_title' => $quiz->module?->course?->title,
                'passing_grade' => (float) $quiz->passing_grade,
                'total_attempts' => $totalAttempts,
                'total_passed' => $totalPassed,
                'total_failed' => $totalFailed,
                'pass_rate' => $passRate,
                'average_score' => $avgScore,
                'min_score' => $minScore,
                'max_score' => $maxScore,
            ];
        });

        $paginated->setCollection($items);

        return $paginated;
    }
}
