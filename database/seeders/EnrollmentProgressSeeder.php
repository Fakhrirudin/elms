<?php

namespace Database\Seeders;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialProgress;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Modules\Certificates\Services\CertificateService;
use Illuminate\Database\Seeder;

class EnrollmentProgressSeeder extends Seeder
{
    public function run(): void
    {
        $employee = User::where('email', 'employee@elms.test')->firstOrFail();
        $employee2 = User::where('email', 'ahmad.fauzi@elms.test')->firstOrFail();

        $course1 = Course::where('slug', 'arsitektur-web-enterprise-modern')->firstOrFail();
        $course2 = Course::where('slug', 'dasar-dasar-keamanan-siber-asn')->firstOrFail();

        // 1. Employee 1 -> Course 1 (COMPLETED with Certificate)
        $enrollment1 = Enrollment::query()->firstOrCreate(
            ['user_id' => $employee->id, 'course_id' => $course1->id],
            [
                'status' => Enrollment::STATUS_IN_PROGRESS,
                'enrolled_at' => now()->subDays(5),
            ]
        );

        // Complete mandatory materials for course 1
        $mandatoryMaterials = Material::query()
            ->whereHas('module', fn ($q) => $q->where('course_id', $course1->id))
            ->where('is_mandatory', true)
            ->get();

        foreach ($mandatoryMaterials as $mat) {
            MaterialProgress::query()->firstOrCreate(
                ['enrollment_id' => $enrollment1->id, 'material_id' => $mat->id],
                ['completed_at' => now()->subDays(3)]
            );
        }

        // Quiz 1 Attempt
        $quiz1 = Quiz::query()->whereHas('module', fn ($q) => $q->where('course_id', $course1->id))->firstOrFail();

        $attempt = QuizAttempt::query()->firstOrCreate(
            ['quiz_id' => $quiz1->id, 'user_id' => $employee->id, 'attempt_number' => 1],
            [
                'score' => 100.0,
                'passed' => true,
                'started_at' => now()->subDays(2),
                'submitted_at' => now()->subDays(2),
            ]
        );

        // Record answers for attempt
        foreach ($quiz1->questions as $question) {
            $correctOption = $question->options()->where('is_correct', true)->first();
            if ($correctOption) {
                QuizAnswer::query()->firstOrCreate(
                    ['attempt_id' => $attempt->id, 'question_id' => $question->id],
                    ['option_id' => $correctOption->id]
                );
            }
        }

        // Issue certificate idempotently via service if not already present
        if (! $enrollment1->certificate()->exists()) {
            app(CertificateService::class)->generateCertificate($enrollment1);
        }

        // 2. Employee 1 -> Course 2 (IN_PROGRESS)
        $enrollment2 = Enrollment::query()->firstOrCreate(
            ['user_id' => $employee->id, 'course_id' => $course2->id],
            [
                'status' => Enrollment::STATUS_IN_PROGRESS,
                'enrolled_at' => now()->subDay(),
            ]
        );

        $matSec1 = Material::query()
            ->whereHas('module', fn ($q) => $q->where('course_id', $course2->id))
            ->first();

        if ($matSec1) {
            MaterialProgress::query()->firstOrCreate(
                ['enrollment_id' => $enrollment2->id, 'material_id' => $matSec1->id],
                ['completed_at' => now()->subHours(6)]
            );
        }

        // 3. Employee 2 -> Course 2 (ENROLLED)
        Enrollment::query()->firstOrCreate(
            ['user_id' => $employee2->id, 'course_id' => $course2->id],
            [
                'status' => Enrollment::STATUS_ENROLLED,
                'enrolled_at' => now()->subHours(2),
            ]
        );
    }
}
