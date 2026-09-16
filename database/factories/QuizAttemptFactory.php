<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizAttempt>
 */
class QuizAttemptFactory extends Factory
{
    protected $model = QuizAttempt::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'user_id' => User::factory(),
            'attempt_number' => 1,
            'score' => null,
            'passed' => null,
            'started_at' => now(),
            'submitted_at' => null,
        ];
    }

    public function submitted(float $score = 80.00, bool $passed = true): static
    {
        return $this->state(fn (array $attributes) => [
            'score' => $score,
            'passed' => $passed,
            'submitted_at' => now(),
        ]);
    }

    public function passed(float $score = 100.00): static
    {
        return $this->submitted($score, true);
    }

    public function failed(float $score = 40.00): static
    {
        return $this->submitted($score, false);
    }
}
