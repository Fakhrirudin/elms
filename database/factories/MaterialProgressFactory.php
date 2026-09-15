<?php

namespace Database\Factories;

use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialProgress;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MaterialProgress>
 */
class MaterialProgressFactory extends Factory
{
    protected $model = MaterialProgress::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'enrollment_id' => Enrollment::factory(),
            'material_id' => Material::factory(),
            'completed_at' => now(),
        ];
    }
}

