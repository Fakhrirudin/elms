<?php

namespace Database\Factories;

use App\Models\Module;
use App\Models\Quiz;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Quiz>
 */
class QuizFactory extends Factory
{
    protected $model = Quiz::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'module_id' => Module::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'passing_grade' => 70.00,
            'max_attempts' => 3,
            'time_limit_minutes' => 30,
            'status' => Quiz::STATUS_DRAFT,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Quiz::STATUS_PUBLISHED,
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Quiz::STATUS_DRAFT,
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Quiz::STATUS_ARCHIVED,
        ]);
    }
}
