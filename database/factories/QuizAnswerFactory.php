<?php

namespace Database\Factories;

use App\Models\Option;
use App\Models\Question;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizAnswer>
 */
class QuizAnswerFactory extends Factory
{
    protected $model = QuizAnswer::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'attempt_id' => QuizAttempt::factory(),
            'question_id' => Question::factory(),
            'option_id' => Option::factory(),
        ];
    }
}

