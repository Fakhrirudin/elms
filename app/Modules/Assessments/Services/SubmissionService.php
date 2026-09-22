<?php

namespace App\Modules\Assessments\Services;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Enrollment;
use App\Models\User;
use App\Modules\Notifications\Services\NotificationService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubmissionService
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * Concurrency-safe submission creation / resubmission.
     *
     * @param  array<string, mixed>  $data
     */
    public function createSubmission(Assignment $assignment, User $user, UploadedFile $file, ?string $comment = null): AssignmentSubmission
    {
        return DB::transaction(function () use ($assignment, $user, $file, $comment) {
            /** @var Assignment $lockedAssignment */
            $lockedAssignment = Assignment::where('id', $assignment->id)
                ->lockForUpdate()
                ->firstOrFail();

            // 1. Validate Assignment Status
            if (! $lockedAssignment->isPublished()) {
                throw ValidationException::withMessages([
                    'assignment' => 'This assignment is not currently open for submissions.',
                ]);
            }

            // 2. Validate Deadline (NULL means no deadline; only reject if due_at < now)
            if ($lockedAssignment->isPastDue()) {
                throw ValidationException::withMessages([
                    'deadline' => 'Assignment submission deadline has passed.',
                ]);
            }

            // 3. Validate Student Enrollment in the Parent Course
            $courseId = $lockedAssignment->module?->course_id;
            if (! $courseId) {
                throw ValidationException::withMessages([
                    'assignment' => 'Invalid curriculum structure: course not found.',
                ]);
            }

            $isEnrolled = Enrollment::where('user_id', $user->id)
                ->where('course_id', $courseId)
                ->exists();

            if (! $isEnrolled) {
                throw ValidationException::withMessages([
                    'enrollment' => 'You must be actively enrolled in this course to submit assignments.',
                ]);
            }

            // 4. Lock existing user submission attempts for this assignment
            $existingSubmissions = AssignmentSubmission::where('assignment_id', $lockedAssignment->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->orderBy('attempt_number', 'asc')
                ->get();

            $attemptCount = $existingSubmissions->count();

            // 5. Validate Max Attempts
            if ($attemptCount >= $lockedAssignment->max_attempts) {
                throw ValidationException::withMessages([
                    'attempts' => "Maximum submission attempts ({$lockedAssignment->max_attempts}) reached.",
                ]);
            }

            // 6. Validate Resubmission Precondition: previous must be NEEDS_REVISION
            if ($attemptCount > 0) {
                /** @var AssignmentSubmission $latestSubmission */
                $latestSubmission = $existingSubmissions->last();
                if ($latestSubmission->status !== AssignmentSubmission::STATUS_NEEDS_REVISION) {
                    throw ValidationException::withMessages([
                        'resubmission' => 'Resubmission is only allowed when your previous attempt has been marked as Needs Revision.',
                    ]);
                }
            }

            $nextAttemptNumber = $attemptCount + 1;

            // 7. Store file securely in private disk
            $filePath = $file->store('assignments/submissions', 'local');

            try {
                $submission = AssignmentSubmission::create([
                    'assignment_id' => $lockedAssignment->id,
                    'user_id' => $user->id,
                    'attempt_number' => $nextAttemptNumber,
                    'file_path' => $filePath,
                    'original_filename' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                    'file_size' => $file->getSize(),
                    'comment' => $comment,
                    'status' => AssignmentSubmission::STATUS_SUBMITTED,
                    'submitted_at' => now(),
                ]);

                // Notify assigned instructors
                $course = $lockedAssignment->module?->course;
                if ($course) {
                    foreach ($course->instructors as $instructor) {
                        $this->notificationService->notify(
                            $instructor,
                            'ASSIGNMENT_SUBMITTED',
                            "New Assignment Submission: {$lockedAssignment->title}",
                            "{$user->name} has submitted attempt #{$submission->attempt_number} for '{$lockedAssignment->title}'.",
                            [
                                'assignment_id' => $lockedAssignment->id,
                                'submission_id' => $submission->id,
                                'user_id' => $user->id,
                                'user_name' => $user->name,
                                'attempt_number' => $submission->attempt_number,
                            ]
                        );
                    }
                }

                return $submission;
            } catch (QueryException $e) {
                // Safely clean up orphaned private file if duplicate attempt race occurs
                if (Storage::disk('local')->exists($filePath)) {
                    Storage::disk('local')->delete($filePath);
                }

                // Handle PostgreSQL 23505 unique constraint violation
                if ($e->getCode() === '23505') {
                    throw ValidationException::withMessages([
                        'submission' => 'A submission attempt is already being processed for your account. Please refresh and try again.',
                    ]);
                }

                throw $e;
            }
        });
    }

    /**
     * Start reviewing a submission (SUBMITTED -> UNDER_REVIEW).
     */
    public function startReview(AssignmentSubmission $submission, User $reviewer): AssignmentSubmission
    {
        if ($submission->status === AssignmentSubmission::STATUS_SUBMITTED) {
            $submission->update([
                'status' => AssignmentSubmission::STATUS_UNDER_REVIEW,
                'reviewed_by' => $reviewer->id,
            ]);
        }

        return $submission;
    }

    /**
     * Grade and review a submission (PASSED or NEEDS_REVISION).
     *
     * @param  array<string, mixed>  $data
     */
    public function reviewSubmission(AssignmentSubmission $submission, User $reviewer, array $data): AssignmentSubmission
    {
        $assignment = $submission->assignment;
        $score = (int) $data['score'];

        if ($score < 0 || $score > $assignment->max_score) {
            throw ValidationException::withMessages([
                'score' => "Score must be an integer between 0 and {$assignment->max_score}.",
            ]);
        }

        if ($data['status'] === AssignmentSubmission::STATUS_NEEDS_REVISION && empty(trim($data['feedback'] ?? ''))) {
            throw ValidationException::withMessages([
                'feedback' => 'Feedback is required when requesting revision.',
            ]);
        }

        $isFirstReview = $submission->reviewed_at === null;

        $submission->update([
            'status' => $data['status'],
            'score' => $score,
            'feedback' => $data['feedback'] ?? null,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
        ]);

        // Send in-app notification to learner (avoid duplicate notifications on repeated requests)
        $submission->loadMissing(['user', 'assignment']);
        if ($isFirstReview && $submission->user) {
            $statusLabel = $submission->status === AssignmentSubmission::STATUS_PASSED ? 'Passed' : 'Needs Revision';
            $this->notificationService->notify(
                $submission->user,
                'ASSIGNMENT_REVIEWED',
                "Assignment Evaluated: {$assignment->title}",
                "Your attempt #{$submission->attempt_number} for '{$assignment->title}' was reviewed: {$statusLabel} (Score: {$submission->score}/{$assignment->max_score}).",
                [
                    'assignment_id' => $assignment->id,
                    'submission_id' => $submission->id,
                    'status' => $submission->status,
                    'score' => $submission->score,
                ]
            );
        }

        return $submission;
    }

    /**
     * @return Collection<int, AssignmentSubmission>
     */
    public function getUserSubmissions(Assignment $assignment, User $user): Collection
    {
        return AssignmentSubmission::where('assignment_id', $assignment->id)
            ->where('user_id', $user->id)
            ->with(['reviewer'])
            ->orderBy('attempt_number', 'desc')
            ->get();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<AssignmentSubmission>
     */
    public function listSubmissionsForAssignment(Assignment $assignment, array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = AssignmentSubmission::where('assignment_id', $assignment->id)
            ->with(['user.department', 'reviewer'])
            ->latest('submitted_at');

        if (! empty($filters['status'])) {
            $query->where('status', (string) $filters['status']);
        }

        if (! empty($filters['search'])) {
            $search = '%'.(string) $filters['search'].'%';
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'ilike', $search)
                    ->orWhere('email', 'ilike', $search);
            });
        }

        return $query->paginate($perPage);
    }

    /**
     * Download authorized submission file from private storage.
     */
    public function downloadSubmissionFile(AssignmentSubmission $submission): StreamedResponse
    {
        if (! Storage::disk('local')->exists($submission->file_path)) {
            abort(404, 'Submission file not found in storage.');
        }

        return Storage::disk('local')->download(
            $submission->file_path,
            $submission->original_filename,
            ['Content-Type' => $submission->mime_type]
        );
    }
}
