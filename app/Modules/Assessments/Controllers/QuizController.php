<?php

namespace App\Modules\Assessments\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Quiz;
use App\Modules\Assessments\Requests\StoreQuizRequest;
use App\Modules\Assessments\Requests\UpdateQuizRequest;
use App\Modules\Assessments\Requests\UpdateQuizStatusRequest;
use App\Modules\Assessments\Resources\QuizResource;
use App\Modules\Assessments\Services\QuizService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function __construct(private readonly QuizService $quizService) {}

    public function store(StoreQuizRequest $request, Module $module): JsonResponse
    {
        $this->authorize('create', [Quiz::class, $module]);

        $quiz = $this->quizService->createQuiz($module, $request->validated());

        return ApiResponse::success(
            new QuizResource($quiz),
            'Quiz created successfully',
            201,
        );
    }

    public function show(Request $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('view', $quiz);

        $quiz = $this->quizService->getQuiz($quiz);
        $user = $request->user();
        $canManage = $user !== null && $user->can('update', $quiz);

        $resource = (new QuizResource($quiz))->withRevealedCorrect($canManage);

        return ApiResponse::success(
            $resource,
            'Quiz retrieved successfully',
        );
    }

    public function update(UpdateQuizRequest $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('update', $quiz);

        $quiz = $this->quizService->updateQuiz($quiz, $request->validated());

        return ApiResponse::success(
            new QuizResource($quiz),
            'Quiz updated successfully',
        );
    }

    public function destroy(Quiz $quiz): JsonResponse
    {
        $this->authorize('delete', $quiz);

        $this->quizService->deleteQuiz($quiz);

        return ApiResponse::success(
            null,
            'Quiz deleted successfully',
        );
    }

    public function updateStatus(UpdateQuizStatusRequest $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('updateStatus', $quiz);

        $quiz = $this->quizService->updateStatus($quiz, $request->validated()['status']);

        return ApiResponse::success(
            new QuizResource($quiz),
            'Quiz status updated successfully',
        );
    }
}
