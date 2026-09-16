<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $employee = User::where('email', 'employee@elms.test')->first();
        if (! $employee) {
            return;
        }

        $course1 = Course::where('slug', 'arsitektur-web-enterprise-modern')->first();
        $course2 = Course::where('slug', 'dasar-dasar-keamanan-siber-asn')->first();

        // 1. Course Enrolled notification (read)
        Notification::query()->firstOrCreate(
            [
                'user_id' => $employee->id,
                'type' => 'COURSE_ENROLLED',
                'title' => 'Course Enrollment Confirmed',
            ],
            [
                'message' => 'You have successfully enrolled in Arsitektur Web Enterprise Modern.',
                'data' => [
                    'course_id' => $course1?->id,
                    'course_title' => $course1?->title,
                    'slug' => $course1?->slug,
                ],
                'read_at' => now()->subDays(4),
                'created_at' => now()->subDays(5),
            ]
        );

        // 2. Quiz Result notification (read)
        Notification::query()->firstOrCreate(
            [
                'user_id' => $employee->id,
                'type' => 'QUIZ_RESULT',
                'title' => 'Quiz Result: PASSED',
            ],
            [
                'message' => 'You have completed Evaluasi Arsitektur & Transaksi Web with a score of 100/100 (PASSED). Passing grade is 70.',
                'data' => [
                    'quiz_id' => 1,
                    'quiz_title' => 'Evaluasi Arsitektur & Transaksi Web',
                    'course_id' => $course1?->id,
                    'score' => 100,
                    'passed' => true,
                ],
                'read_at' => now()->subDays(1),
                'created_at' => now()->subDays(2),
            ]
        );

        // 3. Certificate Awarded notification (unread)
        Notification::query()->firstOrCreate(
            [
                'user_id' => $employee->id,
                'type' => 'CERTIFICATE_ISSUED',
                'title' => 'Certificate Awarded',
            ],
            [
                'message' => 'Congratulations! You have completed Arsitektur Web Enterprise Modern and received your certificate.',
                'data' => [
                    'course_id' => $course1?->id,
                    'course_title' => $course1?->title,
                ],
                'read_at' => null,
                'created_at' => now()->subDays(1),
            ]
        );

        // 4. Enrollment in Course 2 (unread)
        if ($course2) {
            Notification::query()->firstOrCreate(
                [
                    'user_id' => $employee->id,
                    'type' => 'COURSE_ENROLLED',
                    'title' => 'Enrolled in Dasar-Dasar Keamanan Siber ASN',
                ],
                [
                    'message' => 'You have successfully enrolled in Dasar-Dasar Keamanan Siber ASN.',
                    'data' => [
                        'course_id' => $course2->id,
                        'course_title' => $course2->title,
                        'slug' => $course2->slug,
                    ],
                    'read_at' => null,
                    'created_at' => now()->subHours(12),
                ]
            );
        }
    }
}
