<?php

namespace Database\Factories;

use App\Models\Certificate;
use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Certificate>
 */
class CertificateFactory extends Factory
{
    protected $model = Certificate::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'enrollment_id' => Enrollment::factory()->completed(),
            'certificate_number' => sprintf('ELMS-%s-%06d', date('Y'), fake()->unique()->numberBetween(1, 999999)),
            'issued_at' => now(),
        ];
    }
}
