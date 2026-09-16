<?php

namespace App\Modules\Certificates\Services;

use App\Models\Certificate;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Modules\Notifications\Services\NotificationService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CertificateService
{
    public function __construct(
        protected ?NotificationService $notificationService = null
    ) {}
    /**
     * @return array{eligible: bool, reasons: string[], mandatory_completed: bool, quizzes_passed: bool, already_issued: bool}
     */
    public function checkEligibility(Enrollment $enrollment): array
    {
        $course = $enrollment->course;

        $mandatoryMaterialIds = Material::query()
            ->whereHas('module', fn ($q) => $q->where('course_id', $course->id))
            ->where('is_mandatory', true)
            ->pluck('id');

        $totalMandatory = $mandatoryMaterialIds->count();
        $completedMandatory = $enrollment->materialProgress()
            ->whereIn('material_id', $mandatoryMaterialIds)
            ->count();

        $mandatoryCompleted = $totalMandatory === 0 || $completedMandatory === $totalMandatory;

        $publishedQuizzes = Quiz::query()
            ->whereHas('module', fn ($q) => $q->where('course_id', $course->id))
            ->where('status', Quiz::STATUS_PUBLISHED)
            ->get();

        $quizzesPassed = true;
        foreach ($publishedQuizzes as $quiz) {
            $hasPassedAttempt = QuizAttempt::query()
                ->where('quiz_id', $quiz->id)
                ->where('user_id', $enrollment->user_id)
                ->where('passed', true)
                ->exists();

            if (! $hasPassedAttempt) {
                $quizzesPassed = false;
                break;
            }
        }

        $alreadyIssued = $enrollment->certificate()->exists();

        $reasons = [];
        if (! $mandatoryCompleted) {
            $reasons[] = 'All mandatory materials must be completed.';
        }
        if (! $quizzesPassed) {
            $reasons[] = 'All published quizzes in the course must be passed.';
        }

        return [
            'eligible' => $mandatoryCompleted && $quizzesPassed,
            'reasons' => $reasons,
            'mandatory_completed' => $mandatoryCompleted,
            'quizzes_passed' => $quizzesPassed,
            'already_issued' => $alreadyIssued,
        ];
    }

    public function generateCertificate(Enrollment $enrollment): Certificate
    {
        $existing = $enrollment->certificate;
        if ($existing !== null) {
            return $existing->load(['enrollment.user', 'enrollment.course']);
        }

        $eligibility = $this->checkEligibility($enrollment);
        if (! $eligibility['eligible']) {
            throw ValidationException::withMessages([
                'certificate' => $eligibility['reasons'],
            ]);
        }

        $certificate = null;
        $maxRetries = 3;

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                $certificate = DB::transaction(function () use ($enrollment) {
                    $existing = Certificate::where('enrollment_id', $enrollment->id)->first();
                    if ($existing !== null) {
                        return $existing;
                    }

                    $year = (int) date('Y');
                    $certificateNumber = $this->generateUniqueCertificateNumber($year);

                    if ($enrollment->status !== Enrollment::STATUS_COMPLETED) {
                        $enrollment->status = Enrollment::STATUS_COMPLETED;
                        $enrollment->completed_at = $enrollment->completed_at ?? now();
                        $enrollment->save();
                    }

                    $newCertificate = Certificate::create([
                        'enrollment_id' => $enrollment->id,
                        'certificate_number' => $certificateNumber,
                        'issued_at' => now(),
                    ]);

                    ($this->notificationService ?? app(NotificationService::class))->notifyCertificateIssued($newCertificate);

                    return $newCertificate;
                });

                break;
            } catch (QueryException $e) {
                if ($attempt === $maxRetries) {
                    throw $e;
                }
                usleep(50000);
            }
        }

        return $certificate->load(['enrollment.user', 'enrollment.course']);
    }

    public function getCertificate(Certificate $certificate): Certificate
    {
        return $certificate->load(['enrollment.user', 'enrollment.course.category']);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listMyCertificates(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return Certificate::query()
            ->whereHas('enrollment', fn ($q) => $q->where('user_id', $user->id))
            ->with(['enrollment.user', 'enrollment.course'])
            ->latest('issued_at')
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listCertificates(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Certificate::query()->with(['enrollment.user', 'enrollment.course']);

        if (! empty($filters['course_id'])) {
            $query->whereHas('enrollment', fn ($q) => $q->where('course_id', $filters['course_id']));
        }

        if (! empty($filters['user_id'])) {
            $query->whereHas('enrollment', fn ($q) => $q->where('user_id', $filters['user_id']));
        }

        return $query->latest('issued_at')->paginate($perPage);
    }

    protected function generateUniqueCertificateNumber(int $year): string
    {
        $prefix = "ELMS-{$year}-";
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            $lockKey = crc32("elms_certificate_seq_{$year}");
            DB::statement('SELECT pg_advisory_xact_lock(?)', [$lockKey]);
        }

        $maxSeq = (int) DB::table('certificates')
            ->where('certificate_number', 'like', "{$prefix}%")
            ->selectRaw('MAX(CAST(SUBSTR(certificate_number, 11, 6) AS INTEGER)) as max_seq')
            ->value('max_seq');

        $nextSeq = $maxSeq + 1;

        return sprintf('%s%06d', $prefix, $nextSeq);
    }
}

