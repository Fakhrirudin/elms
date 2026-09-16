<?php

namespace App\Modules\Reports\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\QuizAttempt;
use App\Models\Role;
use App\Models\User;

class DashboardService
{
    /**
     * @return array<string, mixed>
     */
    public function getDashboard(User $user): array
    {
        if ($user->hasRole(Role::EMPLOYEE)) {
            return $this->getEmployeeDashboard($user);
        }

        if ($user->hasRole(Role::INSTRUCTOR)) {
            return $this->getInstructorDashboard($user);
        }

        return $this->getAdminDashboard();
    }

    /**
     * @return array{total_courses: int, in_progress: int, completed: int, certificates: int}
     */
    protected function getEmployeeDashboard(User $user): array
    {
        $enrollments = $user->enrollments();

        $totalCourses = (clone $enrollments)->count();
        $inProgress = (clone $enrollments)->whereIn('status', [Enrollment::STATUS_ENROLLED, Enrollment::STATUS_IN_PROGRESS])->count();
        $completed = (clone $enrollments)->where('status', Enrollment::STATUS_COMPLETED)->count();
        $certificates = $user->certificates()->count();

        return [
            'total_courses' => $totalCourses,
            'in_progress' => $inProgress,
            'completed' => $completed,
            'certificates' => $certificates,
        ];
    }

    /**
     * @return array{assigned_courses: int, total_enrollments: int, completed_courses: int, average_quiz_score: float}
     */
    protected function getInstructorDashboard(User $user): array
    {
        $assignedCourseIds = Course::query()
            ->whereHas('instructors', fn ($q) => $q->where('users.id', $user->id))
            ->pluck('id');

        $assignedCoursesCount = $assignedCourseIds->count();

        $enrollmentsQuery = Enrollment::query()->whereIn('course_id', $assignedCourseIds);
        $totalEnrollments = (clone $enrollmentsQuery)->count();
        $completedCourses = (clone $enrollmentsQuery)->where('status', Enrollment::STATUS_COMPLETED)->count();

        $averageQuizScore = QuizAttempt::query()
            ->whereNotNull('submitted_at')
            ->whereHas('quiz.module', fn ($q) => $q->whereIn('course_id', $assignedCourseIds))
            ->avg('score');

        return [
            'assigned_courses' => $assignedCoursesCount,
            'total_enrollments' => $totalEnrollments,
            'completed_courses' => $completedCourses,
            'average_quiz_score' => $averageQuizScore !== null ? round((float) $averageQuizScore, 2) : 0.0,
        ];
    }

    /**
     * @return array{total_employees: int, total_courses: int, published_courses: int, total_enrollments: int, completed_courses: int, average_quiz_score: float}
     */
    protected function getAdminDashboard(): array
    {
        $employeeRole = Role::query()->where('name', Role::EMPLOYEE)->first();
        $totalEmployees = $employeeRole ? User::query()->where('role_id', $employeeRole->id)->where('is_active', true)->count() : 0;

        $coursesQuery = Course::query();
        $totalCourses = (clone $coursesQuery)->count();
        $publishedCourses = (clone $coursesQuery)->where('status', Course::STATUS_PUBLISHED)->count();

        $enrollmentsQuery = Enrollment::query();
        $totalEnrollments = (clone $enrollmentsQuery)->count();
        $completedCourses = (clone $enrollmentsQuery)->where('status', Enrollment::STATUS_COMPLETED)->count();

        $averageQuizScore = QuizAttempt::query()
            ->whereNotNull('submitted_at')
            ->avg('score');

        return [
            'total_employees' => $totalEmployees,
            'total_courses' => $totalCourses,
            'published_courses' => $publishedCourses,
            'total_enrollments' => $totalEnrollments,
            'completed_courses' => $completedCourses,
            'average_quiz_score' => $averageQuizScore !== null ? round((float) $averageQuizScore, 2) : 0.0,
        ];
    }
}
