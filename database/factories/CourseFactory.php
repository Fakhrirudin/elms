<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    protected $model = Course::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'category_id' => Category::factory(),
            'title' => $title,
            'slug' => Str::slug($title),
            'description' => fake()->paragraph(),
            'thumbnail' => null,
            'estimated_duration' => fake()->numberBetween(30, 600),
            'status' => Course::STATUS_DRAFT,
            'published_at' => null,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'status' => Course::STATUS_DRAFT,
            'published_at' => null,
        ]);
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => Course::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn () => [
            'status' => Course::STATUS_ARCHIVED,
            'published_at' => now()->subMonth(),
        ]);
    }
}
