<?php

namespace App\Modules\Learning\Services;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Modules\Certificates\Services\CertificateService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CourseCompletionService
{
    public function __construct(
        protected ?CertificateService $certificateService = null
    ) {
        $this->certificateService = $certificateService ?? app(CertificateService::class);
    }

    /**
     * Calculate authoritative progress metrics and module-by-module curriculum state.
     *
     * @return array<string, mixed>
     */
    public function calculateCourseProgress(Enrollment $enrollment): array
    {
        $course = $enrollment->course;

        // Load modules with curriculum hierarchy
        $modules = $course->modules()
            ->with(['materials' => fn ($q) => $q->orderBy('sort_order'), 'quizzes', 'assignments'])
            ->orderBy('sort_order')
            ->get();

        // 1. Mandatory Materials
        $mandatoryMaterialIds = $modules->flatMap->materials
            ->where('is_mandatory', true)
            ->pluck('id')
            ->all();

        $completedMaterialIds = $enrollment->materialProgress()
            ->pluck('completed_at', 'material_id')
            ->all();

        $completedMandatoryCount = 0;
        foreach ($mandatoryMaterialIds as $matId) {
            if (isset($completedMaterialIds[$matId])) {
                $completedMandatoryCount++;
            }
        }
        $totalMandatoryMaterials = count($mandatoryMaterialIds);

        // 2. Published Quizzes
        $publishedQuizzes = $modules->flatMap->quizzes
            ->where('status', Quiz::STATUS_PUBLISHED)
            ->values();

        $publishedQuizIds = $publishedQuizzes->pluck('id')->all();

        $passedQuizIds = QuizAttempt::query()
            ->where('user_id', $enrollment->user_id)
            ->whereIn('quiz_id', $publishedQuizIds)
            ->where('passed', true)
            ->pluck('quiz_id')
            ->unique()
            ->all();

        $passedQuizLookup = array_flip($passedQuizIds);
        $totalPublishedQuizzes = count($publishedQuizIds);
        $passedQuizzesCount = count($passedQuizIds);

        // Quiz attempts summary for user
        $quizAttempts = QuizAttempt::query()
            ->where('user_id', $enrollment->user_id)
            ->whereIn('quiz_id', $publishedQuizIds)
            ->orderByDesc('id')
            ->get()
            ->groupBy('quiz_id');

        // 3. Published & Required Assignments
        $publishedAssignments = $modules->flatMap->assignments
            ->where('status', Assignment::STATUS_PUBLISHED)
            ->values();

        $requiredAssignmentIds = $publishedAssignments
            ->where('is_required', true)
            ->pluck('id')
            ->all();

        $passedAssignmentIds = AssignmentSubmission::query()
            ->where('user_id', $enrollment->user_id)
            ->whereIn('assignment_id', $requiredAssignmentIds)
            ->where('status', AssignmentSubmission::STATUS_PASSED)
            ->pluck('assignment_id')
            ->unique()
            ->all();

        $passedAssignmentLookup = array_flip($passedAssignmentIds);
        $totalRequiredAssignments = count($requiredAssignmentIds);
        $passedAssignmentsCount = count($passedAssignmentIds);

        // Latest submissions for all published assignments in course
        $submissionsByAssignment = AssignmentSubmission::query()
            ->where('user_id', $enrollment->user_id)
            ->whereIn('assignment_id', $publishedAssignments->pluck('id'))
            ->orderByDesc('id')
            ->get()
            ->groupBy('assignment_id');

        // Aggregate Totals
        $totalRequired = $totalMandatoryMaterials + $totalPublishedQuizzes + $totalRequiredAssignments;
        $completedRequired = $completedMandatoryCount + $passedQuizzesCount + $passedAssignmentsCount;

        $overallPercentage = $totalRequired > 0
            ? (int) round(($completedRequired / $totalRequired) * 100)
            : 100;

        $isCompleted = ($totalRequired === 0) || ($completedRequired === $totalRequired);

        // Module-by-Module Outline with Activity States
        $modulesData = [];
        $completedModulesCount = 0;

        foreach ($modules as $module) {
            $modActivities = [];
            $modRequiredCount = 0;
            $modCompletedCount = 0;

            // Materials
            foreach ($module->materials as $mat) {
                $isComp = isset($completedMaterialIds[$mat->id]);
                if ($mat->is_mandatory) {
                    $modRequiredCount++;
                    if ($isComp) {
                        $modCompletedCount++;
                    }
                }

                $modActivities[] = [
                    'type' => 'MATERIAL',
                    'id' => $mat->id,
                    'module_id' => $module->id,
                    'title' => $mat->title,
                    'material_type' => $mat->type,
                    'content' => $mat->content,
                    'file_path' => $mat->file_path,
                    'video_url' => $mat->video_url,
                    'sort_order' => $mat->sort_order,
                    'is_required' => (bool) $mat->is_mandatory,
                    'status' => $isComp ? 'COMPLETED' : 'AVAILABLE',
                    'completed_at' => $completedMaterialIds[$mat->id] ?? null,
                ];
            }

            // Quizzes
            foreach ($module->quizzes as $quiz) {
                if ($quiz->status !== Quiz::STATUS_PUBLISHED) {
                    continue;
                }

                $modRequiredCount++;
                $isPassed = isset($passedQuizLookup[$quiz->id]);
                if ($isPassed) {
                    $modCompletedCount++;
                }

                $attempts = $quizAttempts->get($quiz->id) ?? collect();
                $latestAttempt = $attempts->first();

                $quizStatus = 'AVAILABLE';
                if ($isPassed) {
                    $quizStatus = 'PASSED';
                } elseif ($latestAttempt !== null) {
                    $quizStatus = 'FAILED';
                }

                $modActivities[] = [
                    'type' => 'QUIZ',
                    'id' => $quiz->id,
                    'module_id' => $module->id,
                    'title' => $quiz->title,
                    'description' => $quiz->description,
                    'passing_grade' => (float) $quiz->passing_grade,
                    'max_attempts' => (int) $quiz->max_attempts,
                    'time_limit_minutes' => $quiz->time_limit_minutes,
                    'sort_order' => 1000 + $quiz->id,
                    'is_required' => true,
                    'status' => $quizStatus,
                    'attempts_count' => $attempts->count(),
                    'latest_attempt' => $latestAttempt ? [
                        'id' => $latestAttempt->id,
                        'attempt_number' => $latestAttempt->attempt_number,
                        'score' => $latestAttempt->score,
                        'passed' => (bool) $latestAttempt->passed,
                        'submitted_at' => $latestAttempt->submitted_at?->toISOString(),
                    ] : null,
                ];
            }

            // Assignments
            foreach ($module->assignments as $assignment) {
                if ($assignment->status !== Assignment::STATUS_PUBLISHED) {
                    continue;
                }

                $isRequired = (bool) $assignment->is_required;
                if ($isRequired) {
                    $modRequiredCount++;
                }

                $isPassed = isset($passedAssignmentLookup[$assignment->id]);
                if ($isRequired && $isPassed) {
                    $modCompletedCount++;
                }

                $subs = $submissionsByAssignment->get($assignment->id) ?? collect();
                $latestSub = $subs->first();

                $assignStatus = 'NOT_SUBMITTED';
                if ($latestSub) {
                    $assignStatus = $latestSub->status; // SUBMITTED, UNDER_REVIEW, PASSED, NEEDS_REVISION
                }

                $modActivities[] = [
                    'type' => 'ASSIGNMENT',
                    'id' => $assignment->id,
                    'module_id' => $module->id,
                    'title' => $assignment->title,
                    'instructions' => $assignment->instructions,
                    'max_score' => (int) $assignment->max_score,
                    'max_attempts' => (int) $assignment->max_attempts,
                    'due_at' => $assignment->due_at?->toISOString(),
                    'sort_order' => 2000 + $assignment->id,
                    'is_required' => $isRequired,
                    'status' => $assignStatus,
                    'submission_count' => $subs->count(),
                    'latest_submission' => $latestSub ? [
                        'id' => $latestSub->id,
                        'attempt_number' => $latestSub->attempt_number,
                        'status' => $latestSub->status,
                        'score' => $latestSub->score,
                        'feedback' => $latestSub->feedback,
                        'submitted_at' => $latestSub->submitted_at?->toISOString(),
                        'reviewed_at' => $latestSub->reviewed_at?->toISOString(),
                    ] : null,
                ];
            }

            $modPercentage = $modRequiredCount > 0
                ? (int) round(($modCompletedCount / $modRequiredCount) * 100)
                : 100;

            $modIsCompleted = ($modRequiredCount === 0) || ($modCompletedCount === $modRequiredCount);
            if ($modIsCompleted && count($modActivities) > 0) {
                $completedModulesCount++;
            }

            $modulesData[] = [
                'id' => $module->id,
                'title' => $module->title,
                'description' => $module->description,
                'sort_order' => $module->sort_order,
                'progress_percentage' => $modPercentage,
                'total_required_activities' => $modRequiredCount,
                'completed_required_activities' => $modCompletedCount,
                'is_completed' => $modIsCompleted,
                'activities' => $modActivities,
            ];
        }

        return [
            'overall_percentage' => $overallPercentage,
            'total_required_activities' => $totalRequired,
            'completed_required_activities' => $completedRequired,
            'is_completed' => $isCompleted,
            'materials' => [
                'total_mandatory' => $totalMandatoryMaterials,
                'completed_mandatory' => $completedMandatoryCount,
            ],
            'quizzes' => [
                'total_required' => $totalPublishedQuizzes,
                'passed' => $passedQuizzesCount,
            ],
            'assignments' => [
                'total_required' => $totalRequiredAssignments,
                'passed' => $passedAssignmentsCount,
            ],
            'modules_summary' => [
                'total_modules' => count($modules),
                'completed_modules' => $completedModulesCount,
            ],
            'modules' => $modulesData,
        ];
    }

    /**
     * Authoritatively transition enrollment status to COMPLETED or IN_PROGRESS inside a transaction.
     */
    public function updateCompletionStatus(Enrollment $enrollment): Enrollment
    {
        return DB::transaction(function () use ($enrollment) {
            $lockedEnrollment = Enrollment::query()->lockForUpdate()->find($enrollment->id);
            if (! $lockedEnrollment) {
                return $enrollment;
            }

            $calc = $this->calculateCourseProgress($lockedEnrollment);

            if ($calc['is_completed']) {
                if ($lockedEnrollment->status !== Enrollment::STATUS_COMPLETED) {
                    $lockedEnrollment->status = Enrollment::STATUS_COMPLETED;
                    $lockedEnrollment->completed_at = $lockedEnrollment->completed_at ?? now();
                    $lockedEnrollment->save();
                }
            } elseif ($calc['completed_required_activities'] > 0 || $lockedEnrollment->materialProgress()->exists()) {
                if ($lockedEnrollment->status === Enrollment::STATUS_ENROLLED) {
                    $lockedEnrollment->status = Enrollment::STATUS_IN_PROGRESS;
                    $lockedEnrollment->save();
                }
            }

            return $lockedEnrollment;
        });
    }

    /**
     * Determine the current or next recommended learning activity without relying on localStorage.
     *
     * @param  array<string, mixed>|null  $progressData
     * @return array<string, mixed>|null
     */
    public function getCurrentActivity(Enrollment $enrollment, ?array $progressData = null): ?array
    {
        $data = $progressData ?? $this->calculateCourseProgress($enrollment);

        if ($data['is_completed']) {
            return null;
        }

        // 1. Check if persisted last activity is still incomplete
        if ($enrollment->last_activity_type && $enrollment->last_activity_id) {
            foreach ($data['modules'] as $mod) {
                foreach ($mod['activities'] as $act) {
                    if ($act['type'] === $enrollment->last_activity_type && (int) $act['id'] === (int) $enrollment->last_activity_id) {
                        $isActivityIncomplete = in_array($act['status'], ['AVAILABLE', 'NOT_SUBMITTED', 'FAILED', 'NEEDS_REVISION'], true);
                        if ($isActivityIncomplete) {
                            return $act;
                        }
                    }
                }
            }
        }

        // 2. Otherwise find the first incomplete REQUIRED activity
        foreach ($data['modules'] as $mod) {
            foreach ($mod['activities'] as $act) {
                if ($act['is_required']) {
                    $isActivityIncomplete = in_array($act['status'], ['AVAILABLE', 'NOT_SUBMITTED', 'FAILED', 'NEEDS_REVISION'], true);
                    if ($isActivityIncomplete) {
                        return $act;
                    }
                }
            }
        }

        // 3. Fallback: find any incomplete optional activity
        foreach ($data['modules'] as $mod) {
            foreach ($mod['activities'] as $act) {
                $isActivityIncomplete = in_array($act['status'], ['AVAILABLE', 'NOT_SUBMITTED', 'NEEDS_REVISION'], true);
                if ($isActivityIncomplete) {
                    return $act;
                }
            }
        }

        return null;
    }

    /**
     * Persist learner's last meaningful activity server-side.
     *
     * @throws ValidationException
     */
    public function updateLastActivity(Enrollment $enrollment, string $type, int $id): void
    {
        $allowedTypes = ['MATERIAL', 'QUIZ', 'ASSIGNMENT'];
        if (! in_array($type, $allowedTypes, true)) {
            throw ValidationException::withMessages([
                'activity_type' => ['Invalid learning activity type.'],
            ]);
        }

        $courseId = $enrollment->course_id;
        $isValidActivity = false;

        if ($type === 'MATERIAL') {
            $isValidActivity = Material::query()
                ->where('id', $id)
                ->whereHas('module', fn ($q) => $q->where('course_id', $courseId))
                ->exists();
        } elseif ($type === 'QUIZ') {
            $isValidActivity = Quiz::query()
                ->where('id', $id)
                ->whereHas('module', fn ($q) => $q->where('course_id', $courseId))
                ->exists();
        } elseif ($type === 'ASSIGNMENT') {
            $isValidActivity = Assignment::query()
                ->where('id', $id)
                ->whereHas('module', fn ($q) => $q->where('course_id', $courseId))
                ->exists();
        }

        if (! $isValidActivity) {
            throw ValidationException::withMessages([
                'activity_id' => ['The specified activity does not belong to this enrolled course.'],
            ]);
        }

        $enrollment->update([
            'last_activity_type' => $type,
            'last_activity_id' => $id,
            'last_accessed_at' => now(),
        ]);
    }

    /**
     * Unified comprehensive learning overview for course workspace.
     *
     * @return array<string, mixed>
     */
    public function getLearningOverview(Enrollment $enrollment): array
    {
        // 1. Transactionally evaluate status transition
        $enrollment = $this->updateCompletionStatus($enrollment);
        $enrollment->loadMissing(['course.category', 'course.instructors', 'certificate']);

        // 2. Calculate authoritative progress hierarchy
        $progressData = $this->calculateCourseProgress($enrollment);

        // 3. Determine current activity for Continue Learning
        $currentActivity = $this->getCurrentActivity($enrollment, $progressData);

        // 4. Check certificate eligibility via authoritative CertificateService
        $certificateEligibility = $this->certificateService->checkEligibility($enrollment);

        $existingCertificate = $enrollment->certificate;

        return [
            'enrollment_id' => $enrollment->id,
            'course_id' => $enrollment->course_id,
            'status' => $enrollment->status,
            'enrolled_at' => $enrollment->enrolled_at?->toISOString(),
            'completed_at' => $lockedCompletedAt = $enrollment->completed_at?->toISOString(),
            'last_accessed_at' => $enrollment->last_accessed_at?->toISOString(),
            'overall_percentage' => $progressData['overall_percentage'],
            'total_required_activities' => $progressData['total_required_activities'],
            'completed_required_activities' => $progressData['completed_required_activities'],
            'total_modules' => $progressData['modules_summary']['total_modules'],
            'completed_modules' => $progressData['modules_summary']['completed_modules'],
            'is_course_completed' => $progressData['is_completed'],
            'last_activity' => [
                'type' => $enrollment->last_activity_type,
                'id' => $enrollment->last_activity_id,
                'accessed_at' => $enrollment->last_accessed_at?->toISOString(),
            ],
            'course' => [
                'id' => $enrollment->course->id,
                'title' => $enrollment->course->title,
                'slug' => $enrollment->course->slug,
                'description' => $enrollment->course->description,
                'thumbnail' => $enrollment->course->thumbnail,
                'estimated_duration' => $enrollment->course->estimated_duration,
                'category' => $enrollment->course->category ? [
                    'id' => $enrollment->course->category->id,
                    'name' => $enrollment->course->category->name,
                ] : null,
                'instructors' => $enrollment->course->instructors->map(fn ($i) => [
                    'id' => $i->id,
                    'name' => $i->name,
                    'email' => $i->email,
                ])->values()->all(),
            ],
            'progress' => [
                'overall_percentage' => $progressData['overall_percentage'],
                'total_required_activities' => $progressData['total_required_activities'],
                'completed_required_activities' => $progressData['completed_required_activities'],
                'is_completed' => $progressData['is_completed'],
                'materials' => $progressData['materials'],
                'quizzes' => $progressData['quizzes'],
                'assignments' => $progressData['assignments'],
            ],
            'modules_summary' => $progressData['modules_summary'],
            'current_activity' => $currentActivity,
            'modules' => $progressData['modules'],
            'certificate' => [
                'is_eligible' => $certificateEligibility['eligible'],
                'reasons' => $certificateEligibility['reasons'],
                'certificate' => $existingCertificate ? [
                    'id' => $existingCertificate->id,
                    'certificate_number' => $existingCertificate->certificate_number,
                    'issued_at' => $existingCertificate->issued_at?->toISOString(),
                ] : null,
            ],
        ];
    }
}
