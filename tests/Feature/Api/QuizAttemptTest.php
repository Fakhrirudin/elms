<?php

namespace Tests\Feature\Api;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\Option;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizAttemptTest extends TestCase
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

    /**
     * @return array{course: Course, module: Module, quiz: Quiz, question1: Question, q1OptCorrect: Option, q1OptWrong: Option, question2: Question, q2OptCorrect: Option, q2OptWrong: Option}
     */
    private function createQuizFixture(): array
    {
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $quiz = Quiz::factory()->published()->create([
            'module_id' => $module->id,
            'passing_grade' => 70.0,
            'max_attempts' => 2,
        ]);

        $question1 = Question::factory()->create(['quiz_id' => $quiz->id, 'sort_order' => 1]);
        $q1OptCorrect = Option::factory()->create(['question_id' => $question1->id, 'option_text' => 'Q1 Correct', 'is_correct' => true]);
        $q1OptWrong = Option::factory()->create(['question_id' => $question1->id, 'option_text' => 'Q1 Wrong', 'is_correct' => false]);

        $question2 = Question::factory()->create(['quiz_id' => $quiz->id, 'sort_order' => 2]);
        $q2OptCorrect = Option::factory()->create(['question_id' => $question2->id, 'option_text' => 'Q2 Correct', 'is_correct' => true]);
        $q2OptWrong = Option::factory()->create(['question_id' => $question2->id, 'option_text' => 'Q2 Wrong', 'is_correct' => false]);

        return [
            'course' => $course,
            'module' => $module,
            'quiz' => $quiz,
            'question1' => $question1,
            'q1OptCorrect' => $q1OptCorrect,
            'q1OptWrong' => $q1OptWrong,
            'question2' => $question2,
            'q2OptCorrect' => $q2OptCorrect,
            'q2OptWrong' => $q2OptWrong,
        ];
    }

    public function test_enrolled_employee_can_view_published_quiz_without_exposing_is_correct(): void
    {
        $f = $this->createQuizFixture();
        $employee = $this->userWithRole(Role::EMPLOYEE);
        Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $f['course']->id,
        ]);

        $response = $this->withToken($this->tokenFor($employee))->getJson("/api/v1/quizzes/{$f['quiz']->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $f['quiz']->id);
        $response->assertJsonCount(2, 'data.questions');

        // Verify is_correct is NOT exposed
        $options = $response->json('data.questions.0.options');
        foreach ($options as $opt) {
            $this->assertArrayNotHasKey('is_correct', $opt);
        }
    }

    public function test_employee_cannot_view_draft_quiz(): void
    {
        $f = $this->createQuizFixture();
        $f['quiz']->update(['status' => Quiz::STATUS_DRAFT]);

        $employee = $this->userWithRole(Role::EMPLOYEE);
        Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $f['course']->id,
        ]);

        $response = $this->withToken($this->tokenFor($employee))->getJson("/api/v1/quizzes/{$f['quiz']->id}");

        $response->assertForbidden();
    }

    public function test_employee_cannot_view_quiz_if_not_enrolled_in_course(): void
    {
        $f = $this->createQuizFixture();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $response = $this->withToken($this->tokenFor($employee))->getJson("/api/v1/quizzes/{$f['quiz']->id}");

        $response->assertForbidden();
    }

    public function test_assigned_instructor_can_view_quiz_with_is_correct_exposed(): void
    {
        $f = $this->createQuizFixture();
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $f['course']->instructors()->attach($instructor->id);

        $response = $this->withToken($this->tokenFor($instructor))->getJson("/api/v1/quizzes/{$f['quiz']->id}");

        $response->assertOk();
        $options = $response->json('data.questions.0.options');
        $this->assertArrayHasKey('is_correct', $options[0]);
    }

    public function test_enrolled_employee_can_start_quiz_attempt(): void
    {
        $f = $this->createQuizFixture();
        $employee = $this->userWithRole(Role::EMPLOYEE);
        Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $f['course']->id,
        ]);

        $response = $this->withToken($this->tokenFor($employee))->postJson("/api/v1/quizzes/{$f['quiz']->id}/attempts");

        $response->assertCreated();
        $response->assertJsonPath('data.quiz_id', $f['quiz']->id);
        $response->assertJsonPath('data.attempt_number', 1);
        $response->assertJsonCount(2, 'data.questions');

        // is_correct must NOT be exposed before submission
        $options = $response->json('data.questions.0.options');
        foreach ($options as $opt) {
            $this->assertArrayNotHasKey('is_correct', $opt);
        }

        $this->assertDatabaseHas('quiz_attempts', [
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
        ]);
    }

    public function test_employee_cannot_start_attempt_if_not_enrolled(): void
    {
        $f = $this->createQuizFixture();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $response = $this->withToken($this->tokenFor($employee))->postJson("/api/v1/quizzes/{$f['quiz']->id}/attempts");

        $response->assertForbidden();
    }

    public function test_employee_cannot_start_attempt_if_quiz_is_draft(): void
    {
        $f = $this->createQuizFixture();
        $f['quiz']->update(['status' => Quiz::STATUS_DRAFT]);

        $employee = $this->userWithRole(Role::EMPLOYEE);
        Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $f['course']->id,
        ]);

        $response = $this->withToken($this->tokenFor($employee))->postJson("/api/v1/quizzes/{$f['quiz']->id}/attempts");

        $response->assertForbidden();
    }

    public function test_employee_cannot_start_attempt_if_max_attempts_reached(): void
    {
        $f = $this->createQuizFixture();
        $employee = $this->userWithRole(Role::EMPLOYEE);
        Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $f['course']->id,
        ]);

        // Create 2 existing attempts (max_attempts is 2)
        QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
        ]);
        QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 2,
        ]);

        $response = $this->withToken($this->tokenFor($employee))->postJson("/api/v1/quizzes/{$f['quiz']->id}/attempts");

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('quiz');
    }

    public function test_employee_can_submit_quiz_attempt_and_calculate_score_and_passed(): void
    {
        $f = $this->createQuizFixture();
        $employee = $this->userWithRole(Role::EMPLOYEE);
        Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $f['course']->id,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
            'submitted_at' => null,
        ]);

        $response = $this->withToken($this->tokenFor($employee))->postJson("/api/v1/attempts/{$attempt->id}/submit", [
            'answers' => [
                ['question_id' => $f['question1']->id, 'option_id' => $f['q1OptCorrect']->id],
                ['question_id' => $f['question2']->id, 'option_id' => $f['q2OptCorrect']->id],
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.attempt_id', $attempt->id);
        $response->assertJsonPath('data.score', 100);
        $response->assertJsonPath('data.passing_grade', 70);
        $response->assertJsonPath('data.passed', true);
        $this->assertNotNull($response->json('data.submitted_at'));

        $this->assertDatabaseHas('quiz_attempts', [
            'id' => $attempt->id,
            'score' => 100.0,
            'passed' => true,
        ]);

        $this->assertDatabaseHas('quiz_answers', [
            'attempt_id' => $attempt->id,
            'question_id' => $f['question1']->id,
            'option_id' => $f['q1OptCorrect']->id,
        ]);
        $this->assertDatabaseHas('quiz_answers', [
            'attempt_id' => $attempt->id,
            'question_id' => $f['question2']->id,
            'option_id' => $f['q2OptCorrect']->id,
        ]);
    }

    public function test_employee_submission_calculates_failed_when_below_passing_grade(): void
    {
        $f = $this->createQuizFixture();
        $employee = $this->userWithRole(Role::EMPLOYEE);
        Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $f['course']->id,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
            'submitted_at' => null,
        ]);

        // 1 correct, 1 wrong -> 50% score (passing is 70%)
        $response = $this->withToken($this->tokenFor($employee))->postJson("/api/v1/attempts/{$attempt->id}/submit", [
            'answers' => [
                ['question_id' => $f['question1']->id, 'option_id' => $f['q1OptCorrect']->id],
                ['question_id' => $f['question2']->id, 'option_id' => $f['q2OptWrong']->id],
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.score', 50);
        $response->assertJsonPath('data.passed', false);

        $this->assertDatabaseHas('quiz_attempts', [
            'id' => $attempt->id,
            'score' => 50.0,
            'passed' => false,
        ]);
    }

    public function test_attempt_cannot_be_submitted_twice(): void
    {
        $f = $this->createQuizFixture();
        $employee = $this->userWithRole(Role::EMPLOYEE);
        Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $f['course']->id,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
            'submitted_at' => now(),
        ]);

        $response = $this->withToken($this->tokenFor($employee))->postJson("/api/v1/attempts/{$attempt->id}/submit", [
            'answers' => [
                ['question_id' => $f['question1']->id, 'option_id' => $f['q1OptCorrect']->id],
            ],
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('attempt');
    }

    public function test_submitting_question_not_belonging_to_quiz_is_rejected(): void
    {
        $f = $this->createQuizFixture();
        $otherQuiz = Quiz::factory()->published()->create(['module_id' => $f['module']->id]);
        $otherQuestion = Question::factory()->create(['quiz_id' => $otherQuiz->id]);
        $otherOption = Option::factory()->create(['question_id' => $otherQuestion->id, 'is_correct' => true]);

        $employee = $this->userWithRole(Role::EMPLOYEE);
        Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $f['course']->id,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
            'submitted_at' => null,
        ]);

        $response = $this->withToken($this->tokenFor($employee))->postJson("/api/v1/attempts/{$attempt->id}/submit", [
            'answers' => [
                ['question_id' => $otherQuestion->id, 'option_id' => $otherOption->id],
            ],
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('answers');
    }

    public function test_submitting_option_not_belonging_to_question_is_rejected(): void
    {
        $f = $this->createQuizFixture();
        $employee = $this->userWithRole(Role::EMPLOYEE);
        Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $f['course']->id,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
            'submitted_at' => null,
        ]);

        // Submit question1 with question2's option!
        $response = $this->withToken($this->tokenFor($employee))->postJson("/api/v1/attempts/{$attempt->id}/submit", [
            'answers' => [
                ['question_id' => $f['question1']->id, 'option_id' => $f['q2OptCorrect']->id],
            ],
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('answers');
    }

    public function test_employee_can_view_their_own_attempt(): void
    {
        $f = $this->createQuizFixture();
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
            'attempt_number' => 1,
            'submitted_at' => now(),
            'score' => 100.0,
            'passed' => true,
        ]);

        $response = $this->withToken($this->tokenFor($employee))->getJson("/api/v1/attempts/{$attempt->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $attempt->id);
        $response->assertJsonPath('data.score', 100);
    }

    public function test_other_employee_cannot_view_attempt(): void
    {
        $f = $this->createQuizFixture();
        $employee1 = $this->userWithRole(Role::EMPLOYEE);
        $employee2 = $this->userWithRole(Role::EMPLOYEE);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee1->id,
        ]);

        $response = $this->withToken($this->tokenFor($employee2))->getJson("/api/v1/attempts/{$attempt->id}");

        $response->assertForbidden();
    }

    public function test_instructor_and_admin_can_view_employee_attempt(): void
    {
        $f = $this->createQuizFixture();
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $admin = $this->userWithRole(Role::SUPER_ADMIN);

        $f['course']->instructors()->attach($instructor->id);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $f['quiz']->id,
            'user_id' => $employee->id,
        ]);

        $resInstructor = $this->withToken($this->tokenFor($instructor))->getJson("/api/v1/attempts/{$attempt->id}");
        $resInstructor->assertOk();

        $resAdmin = $this->withToken($this->tokenFor($admin))->getJson("/api/v1/attempts/{$attempt->id}");
        $resAdmin->assertOk();
    }
}
