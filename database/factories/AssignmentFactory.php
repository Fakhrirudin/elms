<?php

namespace Database\Factories;

use App\Models\Assignment;
use App\Models\Module;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Assignment>
 */
class AssignmentFactory extends Factory
{
    protected $model = Assignment::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'module_id' => Module::factory(),
            'title' => fake()->sentence(3),
            'instructions' => fake()->paragraph(),
            'due_at' => now()->addDays(7),
            'max_score' => 100,
            'max_attempts' => 2,
            'is_required' => true,
            'status' => Assignment::STATUS_DRAFT,
            'created_by' => User::factory(),
            'published_at' => null,
            'closed_at' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Assignment::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Assignment::STATUS_DRAFT,
            'published_at' => null,
            'closed_at' => null,
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Assignment::STATUS_CLOSED,
            'closed_at' => now(),
        ]);
    }
}
