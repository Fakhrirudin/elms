<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => 'COURSE_ENROLLED',
            'title' => fake()->sentence(4),
            'message' => fake()->paragraph(),
            'data' => [
                'course_id' => 1,
                'course_title' => 'Test Course',
                'slug' => 'test-course',
            ],
            'read_at' => null,
        ];
    }

    public function read(): static
    {
        return $this->state(fn (array $attributes) => [
            'read_at' => now(),
        ]);
    }

    public function unread(): static
    {
        return $this->state(fn (array $attributes) => [
            'read_at' => null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function courseEnrolled(array $data = []): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'COURSE_ENROLLED',
            'title' => 'Course Enrollment Confirmed',
            'message' => 'You have successfully enrolled in the course.',
            'data' => array_merge([
                'course_id' => 1,
                'course_title' => 'Laravel Development',
                'slug' => 'laravel-development',
            ], $data),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function quizResult(array $data = []): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'QUIZ_RESULT',
            'title' => 'Quiz Result: PASSED',
            'message' => 'You have passed the quiz with score 80.',
            'data' => array_merge([
                'quiz_id' => 1,
                'quiz_title' => 'Fundamentals Quiz',
                'score' => 80.0,
                'passing_grade' => 70.0,
                'passed' => true,
            ], $data),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function certificateIssued(array $data = []): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'CERTIFICATE_ISSUED',
            'title' => 'Certificate Awarded',
            'message' => 'Congratulations! You have been awarded a certificate.',
            'data' => array_merge([
                'certificate_id' => 1,
                'certificate_number' => 'ELMS-2026-000001',
                'course_id' => 1,
                'course_title' => 'Laravel Development',
            ], $data),
        ]);
    }
}

