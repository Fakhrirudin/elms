<?php

namespace App\Modules\Assessments\Services;

use App\Models\Module;
use App\Models\Question;
use App\Models\Quiz;
use Illuminate\Support\Facades\DB;

class QuizService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function createQuiz(Module $module, array $data): Quiz
    {
        return $module->quizzes()->create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'passing_grade' => $data['passing_grade'] ?? 70.0,
            'max_attempts' => $data['max_attempts'] ?? 3,
            'time_limit_minutes' => $data['time_limit_minutes'] ?? null,
            'status' => Quiz::STATUS_DRAFT,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateQuiz(Quiz $quiz, array $data): Quiz
    {
        $quiz->update($data);

        return $quiz;
    }

    public function deleteQuiz(Quiz $quiz): void
    {
        $quiz->delete();
    }

    public function updateStatus(Quiz $quiz, string $status): Quiz
    {
        $quiz->update(['status' => $status]);

        return $quiz;
    }

    public function getQuiz(Quiz $quiz): Quiz
    {
        return $quiz->load(['questions.options']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createQuestion(Quiz $quiz, array $data): Question
    {
        return DB::transaction(function () use ($quiz, $data) {
            $sortOrder = $data['sort_order'] ?? (($quiz->questions()->max('sort_order') ?? -1) + 1);

            /** @var Question $question */
            $question = $quiz->questions()->create([
                'question' => $data['question'],
                'sort_order' => $sortOrder,
            ]);

            foreach ($data['options'] as $index => $optionData) {
                $question->options()->create([
                    'option_text' => $optionData['option_text'],
                    'is_correct' => (bool) $optionData['is_correct'],
                    'sort_order' => $optionData['sort_order'] ?? $index,
                ]);
            }

            return $question->load('options');
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateQuestion(Question $question, array $data): Question
    {
        return DB::transaction(function () use ($question, $data) {
            $questionAttributes = [];
            if (isset($data['question'])) {
                $questionAttributes['question'] = $data['question'];
            }
            if (isset($data['sort_order'])) {
                $questionAttributes['sort_order'] = $data['sort_order'];
            }

            if (! empty($questionAttributes)) {
                $question->update($questionAttributes);
            }

            if (isset($data['options']) && is_array($data['options'])) {
                $question->options()->delete();

                foreach ($data['options'] as $index => $optionData) {
                    $question->options()->create([
                        'option_text' => $optionData['option_text'],
                        'is_correct' => (bool) $optionData['is_correct'],
                        'sort_order' => $optionData['sort_order'] ?? $index,
                    ]);
                }
            }

            return $question->load('options');
        });
    }

    public function deleteQuestion(Question $question): void
    {
        $question->delete();
    }
}
