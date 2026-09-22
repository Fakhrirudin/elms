<?php

namespace Database\Factories;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssignmentSubmission>
 */
class AssignmentSubmissionFactory extends Factory
{
    protected $model = AssignmentSubmission::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'assignment_id' => Assignment::factory(),
            'user_id' => User::factory(),
            'attempt_number' => 1,
            'file_path' => 'assignments/submissions/sample.pdf',
            'original_filename' => 'submission.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024 * 500, // 500 KB
            'comment' => fake()->sentence(),
            'status' => AssignmentSubmission::STATUS_SUBMITTED,
            'submitted_at' => now(),
            'score' => null,
            'feedback' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ];
    }

    public function underReview(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AssignmentSubmission::STATUS_UNDER_REVIEW,
        ]);
    }

    public function passed(int $score = 90): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AssignmentSubmission::STATUS_PASSED,
            'score' => $score,
            'feedback' => 'Well done! Excellent solution.',
            'reviewed_by' => User::factory(),
            'reviewed_at' => now(),
        ]);
    }

    public function needsRevision(int $score = 50, string $feedback = 'Please revise section 2.'): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AssignmentSubmission::STATUS_NEEDS_REVISION,
            'score' => $score,
            'feedback' => $feedback,
            'reviewed_by' => User::factory(),
            'reviewed_at' => now(),
        ]);
    }
}
