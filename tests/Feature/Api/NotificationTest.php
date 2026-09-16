<?php

namespace Tests\Feature\Api;

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
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(User $user): string
    {
        auth()->forgetGuards();

        return $user->createToken('test')->plainTextToken;
    }

    private function userWithRole(string $roleName, bool $isActive = true): User
    {
        $role = Role::query()->firstOrCreate(['name' => $roleName], ['description' => $roleName]);

        return User::factory()->create([
            'role_id' => $role->id,
            'is_active' => $isActive,
        ]);
    }

    public function test_authenticated_user_can_list_own_notifications(): void
    {
        $user1 = $this->userWithRole(Role::EMPLOYEE);
        $user2 = $this->userWithRole(Role::EMPLOYEE);

        Notification::factory()->count(3)->create(['user_id' => $user1->id]);
        Notification::factory()->count(2)->create(['user_id' => $user2->id]);

        $response = $this->withToken($this->tokenFor($user1))
            ->getJson('/api/v1/notifications');

        $response->assertOk();
        $response->assertJsonCount(3, 'data');
        $response->assertJsonPath('meta.unread_count', 3);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'type',
                    'title',
                    'message',
                    'data',
                    'is_read',
                    'read_at',
                    'created_at',
                ],
            ],
            'meta' => [
                'current_page',
                'total',
                'unread_count',
            ],
        ]);
    }

    public function test_unread_filter_returns_only_unread_notifications(): void
    {
        $user = $this->userWithRole(Role::EMPLOYEE);

        Notification::factory()->unread()->create([
            'user_id' => $user->id,
            'title' => 'Unread notification',
        ]);
        Notification::factory()->read()->create([
            'user_id' => $user->id,
            'title' => 'Read notification',
        ]);

        $response = $this->withToken($this->tokenFor($user))
            ->getJson('/api/v1/notifications?unread=true');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.title', 'Unread notification');
        $response->assertJsonPath('data.0.is_read', false);
    }

    public function test_unread_count_endpoint_returns_accurate_count(): void
    {
        $user = $this->userWithRole(Role::EMPLOYEE);

        Notification::factory()->unread()->count(4)->create(['user_id' => $user->id]);
        Notification::factory()->read()->count(2)->create(['user_id' => $user->id]);

        $response = $this->withToken($this->tokenFor($user))
            ->getJson('/api/v1/notifications/unread-count');

        $response->assertOk();
        $response->assertJsonPath('data.unread_count', 4);
    }

    public function test_user_can_mark_own_notification_as_read(): void
    {
        $user = $this->userWithRole(Role::EMPLOYEE);
        $notification = Notification::factory()->unread()->create(['user_id' => $user->id]);

        $this->assertNull($notification->read_at);

        $response = $this->withToken($this->tokenFor($user))
            ->patchJson("/api/v1/notifications/{$notification->id}/read");

        $response->assertOk();
        $response->assertJsonPath('data.is_read', true);
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $user1 = $this->userWithRole(Role::EMPLOYEE);
        $user2 = $this->userWithRole(Role::EMPLOYEE);
        $notification = Notification::factory()->unread()->create(['user_id' => $user2->id]);

        $response = $this->withToken($this->tokenFor($user1))
            ->patchJson("/api/v1/notifications/{$notification->id}/read");

        $response->assertForbidden();
        $this->assertNull($notification->fresh()->read_at);
    }

    public function test_user_can_mark_all_own_notifications_as_read(): void
    {
        $user1 = $this->userWithRole(Role::EMPLOYEE);
        $user2 = $this->userWithRole(Role::EMPLOYEE);

        Notification::factory()->unread()->count(3)->create(['user_id' => $user1->id]);
        $otherNotif = Notification::factory()->unread()->create(['user_id' => $user2->id]);

        $response = $this->withToken($this->tokenFor($user1))
            ->patchJson('/api/v1/notifications/read-all');

        $response->assertOk();
        $response->assertJsonPath('data.updated_count', 3);

        $this->assertEquals(0, Notification::where('user_id', $user1->id)->unread()->count());
        $this->assertEquals(1, Notification::where('user_id', $user2->id)->unread()->count());
        $this->assertNull($otherNotif->fresh()->read_at);
    }

    public function test_user_can_delete_own_notification(): void
    {
        $user = $this->userWithRole(Role::EMPLOYEE);
        $notification = Notification::factory()->create(['user_id' => $user->id]);

        $response = $this->withToken($this->tokenFor($user))
            ->deleteJson("/api/v1/notifications/{$notification->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('notifications', ['id' => $notification->id]);
    }

    public function test_user_cannot_delete_another_users_notification(): void
    {
        $user1 = $this->userWithRole(Role::EMPLOYEE);
        $user2 = $this->userWithRole(Role::EMPLOYEE);
        $notification = Notification::factory()->create(['user_id' => $user2->id]);

        $response = $this->withToken($this->tokenFor($user1))
            ->deleteJson("/api/v1/notifications/{$notification->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('notifications', ['id' => $notification->id]);
    }

    public function test_enrollment_creates_course_enrolled_notification(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create(['title' => 'Advanced Kubernetes']);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/courses/{$course->id}/enroll");

        $response->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $employee->id,
            'type' => 'COURSE_ENROLLED',
            'title' => 'Course Enrollment Confirmed',
        ]);

        $notification = Notification::where('user_id', $employee->id)->first();
        $this->assertNotNull($notification);
        $this->assertEquals($course->id, $notification->data['course_id']);
        $this->assertEquals('Advanced Kubernetes', $notification->data['course_title']);
    }

    public function test_quiz_submission_creates_quiz_result_notification(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();
        Enrollment::factory()->create(['user_id' => $employee->id, 'course_id' => $course->id]);

        $module = Module::factory()->create(['course_id' => $course->id]);
        $quiz = Quiz::factory()->published()->create([
            'module_id' => $module->id,
            'title' => 'Networking 101 Quiz',
            'passing_grade' => 70.0,
            'max_attempts' => 3,
        ]);

        $question = Question::factory()->create(['quiz_id' => $quiz->id]);
        $correctOption = Option::factory()->create(['question_id' => $question->id, 'is_correct' => true]);

        // Start attempt
        $startResponse = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/quizzes/{$quiz->id}/attempts");
        $startResponse->assertCreated();
        $attemptId = $startResponse->json('data.id');

        // Submit attempt with correct answer (100% -> passed)
        $submitResponse = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/attempts/{$attemptId}/submit", [
                'answers' => [
                    [
                        'question_id' => $question->id,
                        'option_id' => $correctOption->id,
                    ],
                ],
            ]);

        $submitResponse->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $employee->id,
            'type' => 'QUIZ_RESULT',
            'title' => 'Quiz Result: PASSED',
        ]);

        $notification = Notification::where('user_id', $employee->id)
            ->where('type', 'QUIZ_RESULT')
            ->first();

        $this->assertNotNull($notification);
        $this->assertEquals($quiz->id, $notification->data['quiz_id']);
        $this->assertEquals('Networking 101 Quiz', $notification->data['quiz_title']);
        $this->assertEquals(100, $notification->data['score']);
        $this->assertTrue($notification->data['passed']);
    }

    public function test_certificate_generation_creates_certificate_issued_notification(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create(['title' => 'DevOps Mastery']);
        $module = Module::factory()->create(['course_id' => $course->id]);
        $material = Material::factory()->text()->create([
            'module_id' => $module->id,
            'is_mandatory' => true,
        ]);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $course->id,
            'status' => Enrollment::STATUS_IN_PROGRESS,
        ]);

        // Complete mandatory material
        $enrollment->materialProgress()->create([
            'material_id' => $material->id,
            'completed_at' => now(),
        ]);

        // Generate certificate
        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/certificate");

        $response->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $employee->id,
            'type' => 'CERTIFICATE_ISSUED',
            'title' => 'Certificate Awarded',
        ]);

        $notification = Notification::where('user_id', $employee->id)
            ->where('type', 'CERTIFICATE_ISSUED')
            ->first();

        $this->assertNotNull($notification);
        $this->assertEquals($course->id, $notification->data['course_id']);
        $this->assertEquals('DevOps Mastery', $notification->data['course_title']);
        $this->assertNotEmpty($notification->data['certificate_number']);
    }

    public function test_unauthenticated_endpoints_return_401(): void
    {
        $this->getJson('/api/v1/notifications')->assertUnauthorized();
        $this->getJson('/api/v1/notifications/unread-count')->assertUnauthorized();
        $this->patchJson('/api/v1/notifications/read-all')->assertUnauthorized();
        $this->patchJson('/api/v1/notifications/1/read')->assertUnauthorized();
        $this->deleteJson('/api/v1/notifications/1')->assertUnauthorized();
    }
}
