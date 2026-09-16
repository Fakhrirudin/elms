<?php

namespace App\Modules\Notifications\Services;

use App\Models\Certificate;
use App\Models\Enrollment;
use App\Models\Notification;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotificationService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<Notification>
     */
    public function getUserNotifications(User $user, array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = Notification::where('user_id', $user->id)
            ->latest('id');

        if (isset($filters['unread'])) {
            $unread = filter_var($filters['unread'], FILTER_VALIDATE_BOOLEAN);
            if ($unread) {
                $query->unread();
            } else {
                $query->read();
            }
        }

        if (! empty($filters['type'])) {
            $query->where('type', (string) $filters['type']);
        }

        return $query->paginate($perPage);
    }

    public function getUnreadCount(User $user): int
    {
        return Notification::where('user_id', $user->id)
            ->unread()
            ->count();
    }

    public function markAsRead(Notification $notification): Notification
    {
        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return $notification;
    }

    public function markAllAsRead(User $user): int
    {
        return Notification::where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);
    }

    public function deleteNotification(Notification $notification): void
    {
        $notification->delete();
    }

    /**
     * @param  array<string, mixed>|null  $data
     */
    public function notify(User $user, string $type, string $title, string $message, ?array $data = null): Notification
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'read_at' => null,
        ]);
    }

    public function notifyCourseEnrolled(Enrollment $enrollment): Notification
    {
        $enrollment->loadMissing(['user', 'course']);

        /** @var User $user */
        $user = $enrollment->user;
        $course = $enrollment->course;

        return $this->notify(
            $user,
            'COURSE_ENROLLED',
            'Course Enrollment Confirmed',
            "You have successfully enrolled in {$course->title}.",
            [
                'course_id' => $course->id,
                'course_title' => $course->title,
                'slug' => $course->slug,
            ]
        );
    }

    public function notifyQuizResult(QuizAttempt $attempt): Notification
    {
        $attempt->loadMissing(['user', 'quiz.module.course']);

        /** @var User $user */
        $user = $attempt->user;
        $quiz = $attempt->quiz;
        $quizTitle = $quiz->title;
        $course = $quiz->module?->course;
        $statusText = $attempt->passed ? 'PASSED' : 'FAILED';
        $score = (float) $attempt->score;
        $passingGrade = (float) $quiz->passing_grade;

        $message = "You have completed {$quizTitle} with a score of {$score}/100 ({$statusText}). Passing grade is {$passingGrade}.";

        return $this->notify(
            $user,
            'QUIZ_RESULT',
            "Quiz Result: {$statusText}",
            $message,
            [
                'quiz_id' => $quiz->id,
                'quiz_title' => $quizTitle,
                'course_id' => $course?->id,
                'course_title' => $course?->title,
                'attempt_number' => $attempt->attempt_number,
                'score' => $score,
                'passing_grade' => $passingGrade,
                'passed' => (bool) $attempt->passed,
            ]
        );
    }

    public function notifyCertificateIssued(Certificate $certificate): Notification
    {
        $certificate->loadMissing(['enrollment.user', 'enrollment.course']);

        /** @var User $user */
        $user = $certificate->enrollment->user;
        $course = $certificate->enrollment->course;

        return $this->notify(
            $user,
            'CERTIFICATE_ISSUED',
            'Certificate Awarded',
            "Congratulations! You have completed {$course->title} and received certificate {$certificate->certificate_number}.",
            [
                'certificate_id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'course_id' => $course->id,
                'course_title' => $course->title,
            ]
        );
    }
}
