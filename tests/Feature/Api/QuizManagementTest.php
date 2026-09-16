<?php

namespace Tests\Feature\Api;

use App\Models\Course;
use App\Models\Module;
use App\Models\Option;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizManagementTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(User $user): string
    {
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

    public function test_admin_can_create_quiz_under_module(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);

        $response = $this->withToken($this->tokenFor($admin))->postJson("/api/v1/modules/{$module->id}/quizzes", [
            'title' => 'Module 1 Assessment',
            'description' => 'Test your understanding of Module 1',
            'passing_grade' => 75.0,
            'max_attempts' => 3,
            'time_limit_minutes' => 30,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.title', 'Module 1 Assessment');
        $response->assertJsonPath('data.status', Quiz::STATUS_DRAFT);
        $response->assertJsonPath('data.passing_grade', 75);
        $response->assertJsonPath('data.max_attempts', 3);
        $response->assertJsonPath('data.time_limit_minutes', 30);

        $this->assertDatabaseHas('quizzes', [
            'module_id' => $module->id,
            'title' => 'Module 1 Assessment',
            'status' => Quiz::STATUS_DRAFT,
        ]);
    }

    public function test_assigned_instructor_can_create_quiz_in_their_course(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->published()->create();
        $course->instructors()->attach($instructor->id);
        $module = Module::factory()->create(['course_id' => $course->id]);

        $response = $this->withToken($this->tokenFor($instructor))->postJson("/api/v1/modules/{$module->id}/quizzes", [
            'title' => 'Instructor Assessment',
            'passing_grade' => 80.0,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('quizzes', [
            'module_id' => $module->id,
            'title' => 'Instructor Assessment',
        ]);
    }

    public function test_unassigned_instructor_cannot_create_quiz_in_course(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);

        $response = $this->withToken($this->tokenFor($instructor))->postJson("/api/v1/modules/{$module->id}/quizzes", [
            'title' => 'Unassigned Assessment',
        ]);

        $response->assertForbidden();
    }

    public function test_employee_cannot_create_quiz(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);

        $response = $this->withToken($this->tokenFor($employee))->postJson("/api/v1/modules/{$module->id}/quizzes", [
            'title' => 'Employee Assessment',
        ]);

        $response->assertForbidden();
    }

    public function test_admin_can_update_quiz(): void
    {
        $admin = $this->userWithRole(Role::LEARNING_ADMIN);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $quiz = Quiz::factory()->draft()->create(['module_id' => $module->id]);

        $response = $this->withToken($this->tokenFor($admin))->putJson("/api/v1/quizzes/{$quiz->id}", [
            'title' => 'Updated Assessment Title',
            'passing_grade' => 85.0,
            'max_attempts' => 5,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.title', 'Updated Assessment Title');
        $response->assertJsonPath('data.passing_grade', 85);
        $response->assertJsonPath('data.max_attempts', 5);

        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz->id,
            'title' => 'Updated Assessment Title',
            'max_attempts' => 5,
        ]);
    }

    public function test_unassigned_instructor_cannot_update_quiz(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $quiz = Quiz::factory()->draft()->create(['module_id' => $module->id]);

        $response = $this->withToken($this->tokenFor($instructor))->putJson("/api/v1/quizzes/{$quiz->id}", [
            'title' => 'Hacked Title',
        ]);

        $response->assertForbidden();
    }

    public function test_admin_can_update_quiz_status(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $quiz = Quiz::factory()->draft()->create(['module_id' => $module->id]);

        $response = $this->withToken($this->tokenFor($admin))->patchJson("/api/v1/quizzes/{$quiz->id}/status", [
            'status' => Quiz::STATUS_PUBLISHED,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.status', Quiz::STATUS_PUBLISHED);

        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz->id,
            'status' => Quiz::STATUS_PUBLISHED,
        ]);
    }

    public function test_admin_can_delete_quiz(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $quiz = Quiz::factory()->draft()->create(['module_id' => $module->id]);

        $response = $this->withToken($this->tokenFor($admin))->deleteJson("/api/v1/quizzes/{$quiz->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('quizzes', ['id' => $quiz->id]);
    }

    public function test_admin_can_create_question_with_options(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $quiz = Quiz::factory()->draft()->create(['module_id' => $module->id]);

        $response = $this->withToken($this->tokenFor($admin))->postJson("/api/v1/quizzes/{$quiz->id}/questions", [
            'question' => 'What is the primary architectural style used in ELMS?',
            'sort_order' => 1,
            'options' => [
                ['option_text' => 'Microservices', 'is_correct' => false],
                ['option_text' => 'Modular Monolith', 'is_correct' => true],
                ['option_text' => 'Serverless Functions', 'is_correct' => false],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.question', 'What is the primary architectural style used in ELMS?');
        $response->assertJsonCount(3, 'data.options');

        $this->assertDatabaseHas('questions', [
            'quiz_id' => $quiz->id,
            'question' => 'What is the primary architectural style used in ELMS?',
        ]);

        $this->assertDatabaseHas('options', [
            'option_text' => 'Modular Monolith',
            'is_correct' => true,
        ]);
    }

    public function test_creating_question_requires_exactly_one_correct_option(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $quiz = Quiz::factory()->draft()->create(['module_id' => $module->id]);

        // Zero correct options
        $responseZero = $this->withToken($this->tokenFor($admin))->postJson("/api/v1/quizzes/{$quiz->id}/questions", [
            'question' => 'No correct option question',
            'options' => [
                ['option_text' => 'Option A', 'is_correct' => false],
                ['option_text' => 'Option B', 'is_correct' => false],
            ],
        ]);
        $responseZero->assertUnprocessable();
        $responseZero->assertJsonValidationErrors('options');

        // Multiple correct options
        $responseMultiple = $this->withToken($this->tokenFor($admin))->postJson("/api/v1/quizzes/{$quiz->id}/questions", [
            'question' => 'Multiple correct options question',
            'options' => [
                ['option_text' => 'Option A', 'is_correct' => true],
                ['option_text' => 'Option B', 'is_correct' => true],
            ],
        ]);
        $responseMultiple->assertUnprocessable();
        $responseMultiple->assertJsonValidationErrors('options');
    }

    public function test_creating_question_requires_at_least_two_options(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $quiz = Quiz::factory()->draft()->create(['module_id' => $module->id]);

        $response = $this->withToken($this->tokenFor($admin))->postJson("/api/v1/quizzes/{$quiz->id}/questions", [
            'question' => 'Only one option question',
            'options' => [
                ['option_text' => 'Single Option', 'is_correct' => true],
            ],
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('options');
    }

    public function test_admin_can_update_question_and_options(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $quiz = Quiz::factory()->draft()->create(['module_id' => $module->id]);
        $question = Question::factory()->create(['quiz_id' => $quiz->id]);
        Option::factory()->create(['question_id' => $question->id, 'option_text' => 'Old A', 'is_correct' => true]);
        Option::factory()->create(['question_id' => $question->id, 'option_text' => 'Old B', 'is_correct' => false]);

        $response = $this->withToken($this->tokenFor($admin))->putJson("/api/v1/questions/{$question->id}", [
            'question' => 'Updated question text',
            'options' => [
                ['option_text' => 'New Option 1', 'is_correct' => false],
                ['option_text' => 'New Option 2', 'is_correct' => true],
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.question', 'Updated question text');

        $this->assertDatabaseHas('questions', [
            'id' => $question->id,
            'question' => 'Updated question text',
        ]);
        $this->assertDatabaseHas('options', [
            'question_id' => $question->id,
            'option_text' => 'New Option 2',
            'is_correct' => true,
        ]);
        $this->assertDatabaseMissing('options', [
            'option_text' => 'Old A',
        ]);
    }

    public function test_admin_can_delete_question(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $quiz = Quiz::factory()->draft()->create(['module_id' => $module->id]);
        $question = Question::factory()->create(['quiz_id' => $quiz->id]);
        Option::factory()->create(['question_id' => $question->id, 'is_correct' => true]);

        $response = $this->withToken($this->tokenFor($admin))->deleteJson("/api/v1/questions/{$question->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('questions', ['id' => $question->id]);
        $this->assertDatabaseMissing('options', ['question_id' => $question->id]);
    }

    public function test_deleting_quiz_cascades_to_questions_and_options(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $quiz = Quiz::factory()->draft()->create(['module_id' => $module->id]);
        $question = Question::factory()->create(['quiz_id' => $quiz->id]);
        $option = Option::factory()->create(['question_id' => $question->id, 'is_correct' => true]);

        $response = $this->withToken($this->tokenFor($admin))->deleteJson("/api/v1/quizzes/{$quiz->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('quizzes', ['id' => $quiz->id]);
        $this->assertDatabaseMissing('questions', ['id' => $question->id]);
        $this->assertDatabaseMissing('options', ['id' => $option->id]);
    }
}
