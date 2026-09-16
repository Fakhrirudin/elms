<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\Module;
use App\Models\Notification;
use App\Models\Option;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LearnerJourneyTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_end_to_end_learner_journey(): void
    {
        // 0. Seed base prerequisite roles & department
        $employeeRole = Role::firstOrCreate(
            ['name' => Role::EMPLOYEE],
            ['description' => 'Employee / Learner']
        );

        $learner = User::factory()->create([
            'name' => 'Fakhri Learner',
            'email' => 'fakhri.learner@elms.test',
            'password' => Hash::make('Password123!'),
            'role_id' => $employeeRole->id,
            'is_active' => true,
        ]);

        $category = Category::factory()->create(['name' => 'Teknologi Informasi']);
        $course = Course::factory()->published()->create([
            'category_id' => $category->id,
            'title' => 'Implementasi Arsitektur Web Modern',
            'slug' => 'implementasi-arsitektur-web-modern',
        ]);

        $module = Module::factory()->create([
            'course_id' => $course->id,
            'title' => 'Modul 1: Fondasi Arsitektur',
            'sort_order' => 1,
        ]);

        $material1 = Material::factory()->text()->create([
            'module_id' => $module->id,
            'title' => 'Prinsip Modular Monolith',
            'is_mandatory' => true,
            'sort_order' => 1,
        ]);

        $material2 = Material::factory()->text()->create([
            'module_id' => $module->id,
            'title' => 'Integritas Transaksi Database',
            'is_mandatory' => true,
            'sort_order' => 2,
        ]);

        $quiz = Quiz::factory()->published()->create([
            'module_id' => $module->id,
            'title' => 'Kuis Evaluasi Modul 1',
            'passing_grade' => 70.0,
            'max_attempts' => 3,
        ]);

        $question1 = Question::factory()->create([
            'quiz_id' => $quiz->id,
            'question' => 'Apakah Modular Monolith memisahkan modul berdasarkan domain?',
            'sort_order' => 1,
        ]);
        $q1Correct = Option::factory()->create([
            'question_id' => $question1->id,
            'option_text' => 'Ya, modul dipisahkan berdasarkan bounded context bisnis.',
            'is_correct' => true,
        ]);
        $q1Wrong = Option::factory()->create([
            'question_id' => $question1->id,
            'option_text' => 'Tidak, seluruh kode disatukan tanpa batasan.',
            'is_correct' => false,
        ]);

        $question2 = Question::factory()->create([
            'quiz_id' => $quiz->id,
            'question' => 'Kapan sertifikat kelulusan dapat diterbitkan?',
            'sort_order' => 2,
        ]);
        $q2Correct = Option::factory()->create([
            'question_id' => $question2->id,
            'option_text' => 'Setelah 100% materi wajib tuntas dan kuis lulus.',
            'is_correct' => true,
        ]);
        $q2Wrong = Option::factory()->create([
            'question_id' => $question2->id,
            'option_text' => 'Kapan saja saat employee menginginkannya.',
            'is_correct' => false,
        ]);

        // ==========================================
        // 1. Authenticate Employee
        // ==========================================
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'fakhri.learner@elms.test',
            'password' => 'Password123!',
        ]);

        $loginResponse->assertOk();
        $token = $loginResponse->json('data.token');
        $this->assertNotEmpty($token);
        $this->assertSame($learner->id, $loginResponse->json('data.user.id'));

        // ==========================================
        // 2. Browse Course Catalog
        // ==========================================
        $catalogResponse = $this->withToken($token)->getJson('/api/v1/courses');

        $catalogResponse->assertOk();
        $catalogResponse->assertJsonFragment([
            'id' => $course->id,
            'title' => 'Implementasi Arsitektur Web Modern',
            'status' => Course::STATUS_PUBLISHED,
        ]);

        // ==========================================
        // 3. Enroll into Course
        // ==========================================
        $enrollResponse = $this->withToken($token)->postJson("/api/v1/courses/{$course->id}/enroll");

        $enrollResponse->assertCreated();
        $enrollmentId = $enrollResponse->json('data.id');
        $this->assertSame(Enrollment::STATUS_ENROLLED, $enrollResponse->json('data.status'));
        $this->assertSame($course->id, $enrollResponse->json('data.course_id'));

        // ==========================================
        // 4. Verify COURSE_ENROLLED Notification
        // ==========================================
        $this->assertDatabaseHas('notifications', [
            'user_id' => $learner->id,
            'type' => Notification::TYPE_COURSE_ENROLLED,
        ]);

        $notifEnroll = $this->withToken($token)->getJson('/api/v1/notifications');
        $notifEnroll->assertOk();
        $this->assertCount(1, $notifEnroll->json('data'));
        $this->assertSame(Notification::TYPE_COURSE_ENROLLED, $notifEnroll->json('data.0.type'));

        // ==========================================
        // 5. Complete All Mandatory Materials
        // ==========================================
        $complete1 = $this->withToken($token)->postJson("/api/v1/enrollments/{$enrollmentId}/materials/{$material1->id}/complete");
        $complete1->assertOk();
        $this->assertSame(50, $complete1->json('data.progress'));

        $complete2 = $this->withToken($token)->postJson("/api/v1/enrollments/{$enrollmentId}/materials/{$material2->id}/complete");
        $complete2->assertOk();
        $this->assertSame(100, $complete2->json('data.progress'));

        // ==========================================
        // 6. Verify Progress Percentage
        // ==========================================
        $progressResponse = $this->withToken($token)->getJson("/api/v1/enrollments/{$enrollmentId}/progress");
        $progressResponse->assertOk();
        $this->assertSame(100, $progressResponse->json('data.progress'));
        $this->assertSame(2, $progressResponse->json('data.completed_mandatory_materials'));
        $this->assertSame(2, $progressResponse->json('data.total_mandatory_materials'));

        // ==========================================
        // 7. Start Quiz Attempt
        // ==========================================
        $startAttemptResponse = $this->withToken($token)->postJson("/api/v1/quizzes/{$quiz->id}/attempts");
        $startAttemptResponse->assertCreated();
        $attemptId = $startAttemptResponse->json('data.id');
        $this->assertSame(1, $startAttemptResponse->json('data.attempt_number'));
        $this->assertSame($quiz->id, $startAttemptResponse->json('data.quiz_id'));

        // ==========================================
        // 8. Submit Correct Answers
        // ==========================================
        $submitResponse = $this->withToken($token)->postJson("/api/v1/attempts/{$attemptId}/submit", [
            'answers' => [
                ['question_id' => $question1->id, 'option_id' => $q1Correct->id],
                ['question_id' => $question2->id, 'option_id' => $q2Correct->id],
            ],
        ]);

        $submitResponse->assertOk();
        $this->assertEquals(100.0, $submitResponse->json('data.score'));
        $this->assertTrue($submitResponse->json('data.passed'));

        // ==========================================
        // 9. Verify QUIZ_RESULT Notification
        // ==========================================
        $this->assertDatabaseHas('notifications', [
            'user_id' => $learner->id,
            'type' => Notification::TYPE_QUIZ_RESULT,
        ]);

        // ==========================================
        // 10. Request Certificate
        // ==========================================
        $certResponse = $this->withToken($token)->postJson("/api/v1/enrollments/{$enrollmentId}/certificate");
        $certResponse->assertCreated();

        // ==========================================
        // 11. Verify Certificate Number Format (ELMS-YYYY-XXXXXX)
        // ==========================================
        $certNumber = $certResponse->json('data.certificate_number');
        $currentYear = date('Y');
        $this->assertMatchesRegularExpression("/^ELMS-{$currentYear}-\\d{6}$/", $certNumber);

        // ==========================================
        // 12. Verify Enrollment Status Transition to COMPLETED
        // ==========================================
        $this->assertDatabaseHas('enrollments', [
            'id' => $enrollmentId,
            'status' => Enrollment::STATUS_COMPLETED,
        ]);
        $completedEnrollment = Enrollment::findOrFail($enrollmentId);
        $this->assertNotNull($completedEnrollment->completed_at);

        // ==========================================
        // 13. Verify CERTIFICATE_ISSUED Notification
        // ==========================================
        $this->assertDatabaseHas('notifications', [
            'user_id' => $learner->id,
            'type' => Notification::TYPE_CERTIFICATE_ISSUED,
        ]);

        // ==========================================
        // 14. Verify Learner Dashboard Metrics
        // ==========================================
        $dashboardResponse = $this->withToken($token)->getJson('/api/v1/dashboard');
        $dashboardResponse->assertOk();
        $dashboardResponse->assertJsonPath('data.total_courses', 1);
        $dashboardResponse->assertJsonPath('data.in_progress', 0);
        $dashboardResponse->assertJsonPath('data.completed', 1);
        $dashboardResponse->assertJsonPath('data.certificates', 1);

        // ==========================================
        // 15. Verify Notification Inbox (3 distinct events)
        // ==========================================
        $inboxResponse = $this->withToken($token)->getJson('/api/v1/notifications');
        $inboxResponse->assertOk();
        $items = $inboxResponse->json('data');
        $this->assertCount(3, $items);

        $notificationTypes = array_column($items, 'type');
        $this->assertContains(Notification::TYPE_COURSE_ENROLLED, $notificationTypes);
        $this->assertContains(Notification::TYPE_QUIZ_RESULT, $notificationTypes);
        $this->assertContains(Notification::TYPE_CERTIFICATE_ISSUED, $notificationTypes);

        // Verify all 3 are currently unread
        foreach ($items as $item) {
            $this->assertNull($item['read_at']);
        }

        // ==========================================
        // 16. Verify Unread Count
        // ==========================================
        $unreadCountResponse = $this->withToken($token)->getJson('/api/v1/notifications/unread-count');
        $unreadCountResponse->assertOk();
        $unreadCountResponse->assertJsonPath('data.unread_count', 3);

        // ==========================================
        // 17. Mark All Notifications as Read
        // ==========================================
        $markAllResponse = $this->withToken($token)->patchJson('/api/v1/notifications/read-all');
        $markAllResponse->assertOk();
        $markAllResponse->assertJsonPath('data.updated_count', 3);

        $afterReadCountResponse = $this->withToken($token)->getJson('/api/v1/notifications/unread-count');
        $afterReadCountResponse->assertOk();
        $afterReadCountResponse->assertJsonPath('data.unread_count', 0);

        // Verify in DB all 3 have read_at not null
        $this->assertSame(0, Notification::where('user_id', $learner->id)->whereNull('read_at')->count());
    }
}
