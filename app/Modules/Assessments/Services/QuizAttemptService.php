<?php

namespace App\Modules\Assessments\Services;

use App\Models\Option;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Modules\Notifications\Services\NotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuizAttemptService
{
    public function __construct(
        protected ?NotificationService $notificationService = null
    ) {}

    public function startAttempt(User $user, Quiz $quiz): QuizAttempt
    {
        $existingAttemptsCount = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->count();

        if ($existingAttemptsCount >= $quiz->max_attempts) {
            throw ValidationException::withMessages([
                'quiz' => ['Maximum quiz attempts reached.'],
            ]);
        }

        $attemptNumber = $existingAttemptsCount + 1;

        /** @var QuizAttempt $attempt */
        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'attempt_number' => $attemptNumber,
            'started_at' => now(),
        ]);

        return $attempt->load(['quiz.questions.options']);
    }

    public function getAttempt(QuizAttempt $attempt): QuizAttempt
    {
        return $attempt->load(['quiz.questions.options', 'answers']);
    }

    /**
     * @param  array<int, array{question_id: int, option_id: int}>  $answers
     */
    public function submitAttempt(QuizAttempt $attempt, array $answers): QuizAttempt
    {
        if ($attempt->submitted_at !== null) {
            throw ValidationException::withMessages([
                'attempt' => ['Quiz attempt has already been submitted.'],
            ]);
        }

        $quiz = $attempt->quiz;
        $quizQuestions = $quiz->questions()->with('options')->get();
        $quizQuestionIds = $quizQuestions->pluck('id')->all();

        $seenQuestionIds = [];
        $optionIds = array_column($answers, 'option_id');
        $options = Option::whereIn('id', $optionIds)->get()->keyBy('id');

        foreach ($answers as $ans) {
            $questionId = (int) $ans['question_id'];
            $optionId = (int) $ans['option_id'];

            if (! in_array($questionId, $quizQuestionIds, true)) {
                throw ValidationException::withMessages([
                    'answers' => ["Question {$questionId} does not belong to this quiz."],
                ]);
            }

            if (in_array($questionId, $seenQuestionIds, true)) {
                throw ValidationException::withMessages([
                    'answers' => ["Duplicate answer for question {$questionId}."],
                ]);
            }
            $seenQuestionIds[] = $questionId;

            $option = $options->get($optionId);
            if (! $option || $option->question_id !== $questionId) {
                throw ValidationException::withMessages([
                    'answers' => ["Option {$optionId} does not belong to question {$questionId}."],
                ]);
            }
        }

        $totalQuestions = count($quizQuestionIds);
        $correctCount = 0;

        foreach ($answers as $ans) {
            $option = $options->get((int) $ans['option_id']);
            if ($option && $option->is_correct) {
                $correctCount++;
            }
        }

        $score = $totalQuestions > 0 ? round(($correctCount / $totalQuestions) * 100, 2) : 0.0;
        $passed = $score >= (float) $quiz->passing_grade;

        DB::transaction(function () use ($attempt, $answers, $score, $passed) {
            foreach ($answers as $ans) {
                QuizAnswer::create([
                    'attempt_id' => $attempt->id,
                    'question_id' => $ans['question_id'],
                    'option_id' => $ans['option_id'],
                ]);
            }

            $attempt->update([
                'score' => $score,
                'passed' => $passed,
                'submitted_at' => now(),
            ]);

            ($this->notificationService ?? app(NotificationService::class))->notifyQuizResult($attempt);
        });

        return $attempt->fresh(['quiz.questions.options', 'answers']);
    }
}
