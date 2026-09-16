<?php

namespace App\Modules\Assessments\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Modules\Assessments\Requests\SubmitQuizAttemptRequest;
use App\Modules\Assessments\Resources\QuizAttemptResource;
use App\Modules\Assessments\Resources\QuizSubmitResultResource;
use App\Modules\Assessments\Services\QuizAttemptService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizAttemptController extends Controller
{
    public function __construct(private readonly QuizAttemptService $quizAttemptService) {}

    public function start(Request $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('startAttempt', $quiz);

        $attempt = $this->quizAttemptService->startAttempt($request->user(), $quiz);

        return ApiResponse::success(
            new QuizAttemptResource($attempt),
            'Quiz attempt started',
            201,
        );
    }

    public function show(QuizAttempt $attempt): JsonResponse
    {
        $this->authorize('view', $attempt);

        $attempt = $this->quizAttemptService->getAttempt($attempt);

        return ApiResponse::success(
            new QuizAttemptResource($attempt),
            'Quiz attempt retrieved successfully',
        );
    }

    public function submit(SubmitQuizAttemptRequest $request, QuizAttempt $attempt): JsonResponse
    {
        $this->authorize('submit', $attempt);

        $attempt = $this->quizAttemptService->submitAttempt($attempt, $request->validated()['answers']);

        return ApiResponse::success(
            new QuizSubmitResultResource($attempt),
            'Quiz submitted successfully',
        );
    }
}

