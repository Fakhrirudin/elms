<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Role>
 */
class RoleFactory extends Factory
{
    protected $model = Role::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => strtoupper('role_'.fake()->unique()->lexify('??????')),
            'description' => fake()->sentence(),
        ];
    }

    public function superAdmin(): static
    {
        return $this->state(fn () => [
            'name' => Role::SUPER_ADMIN,
            'description' => 'Full access to all system functionality.',
        ]);
    }

    public function learningAdmin(): static
    {
        return $this->state(fn () => [
            'name' => Role::LEARNING_ADMIN,
            'description' => 'Manages courses, learning content, and reports.',
        ]);
    }

    public function instructor(): static
    {
        return $this->state(fn () => [
            'name' => Role::INSTRUCTOR,
            'description' => 'Manages assigned courses and their learning content.',
        ]);
    }

    public function employee(): static
    {
        return $this->state(fn () => [
            'name' => Role::EMPLOYEE,
            'description' => 'Enrolls in courses and completes learning activities.',
        ]);
    }
}
