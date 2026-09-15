<?php

namespace Database\Factories;

use App\Models\Material;
use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Material>
 */
class MaterialFactory extends Factory
{
    protected $model = Material::class;

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
            'type' => Material::TYPE_TEXT,
            'content' => fake()->paragraphs(3, true),
            'file_path' => null,
            'video_url' => null,
            'sort_order' => fake()->numberBetween(0, 10),
            'is_mandatory' => true,
        ];
    }

    public function text(): static
    {
        return $this->state(fn () => [
            'type' => Material::TYPE_TEXT,
            'content' => fake()->paragraphs(3, true),
            'file_path' => null,
            'video_url' => null,
        ]);
    }

    public function video(): static
    {
        return $this->state(fn () => [
            'type' => Material::TYPE_VIDEO,
            'content' => null,
            'file_path' => null,
            'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ]);
    }

    public function pdf(): static
    {
        return $this->state(fn () => [
            'type' => Material::TYPE_PDF,
            'content' => null,
            'file_path' => 'materials/pdf/sample.pdf',
            'video_url' => null,
        ]);
    }
}
