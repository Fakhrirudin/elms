<?php

namespace App\Modules\Assessments\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\Quiz;
use App\Modules\Assessments\Requests\StoreQuestionRequest;
use App\Modules\Assessments\Requests\UpdateQuestionRequest;
use App\Modules\Assessments\Resources\QuestionResource;
use App\Modules\Assessments\Services\QuizService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class QuestionController extends Controller
{
    public function __construct(private readonly QuizService $quizService) {}

    public function store(StoreQuestionRequest $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('create', [Question::class, $quiz]);

        $question = $this->quizService->createQuestion($quiz, $request->validated());

        return ApiResponse::success(
            (new QuestionResource($question))->withRevealedCorrect(true),
            'Question created successfully',
            201,
        );
    }

    public function update(UpdateQuestionRequest $request, Question $question): JsonResponse
    {
        $this->authorize('update', $question);

        $question = $this->quizService->updateQuestion($question, $request->validated());

        return ApiResponse::success(
            (new QuestionResource($question))->withRevealedCorrect(true),
            'Question updated successfully',
        );
    }

    public function destroy(Question $question): JsonResponse
    {
        $this->authorize('delete', $question);

        $this->quizService->deleteQuestion($question);

        return ApiResponse::success(
            null,
            'Question deleted successfully',
        );
    }
}

