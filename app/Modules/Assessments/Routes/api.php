<?php

use App\Modules\Assessments\Controllers\QuestionController;
use App\Modules\Assessments\Controllers\QuizAttemptController;
use App\Modules\Assessments\Controllers\QuizController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    // Quizzes
    Route::post('/modules/{module}/quizzes', [QuizController::class, 'store'])->name('modules.quizzes.store');
    Route::get('/quizzes/{quiz}', [QuizController::class, 'show'])->name('quizzes.show');
    Route::put('/quizzes/{quiz}', [QuizController::class, 'update'])->name('quizzes.update');
    Route::delete('/quizzes/{quiz}', [QuizController::class, 'destroy'])->name('quizzes.destroy');
    Route::patch('/quizzes/{quiz}/status', [QuizController::class, 'updateStatus'])->name('quizzes.status.update');

    // Questions
    Route::post('/quizzes/{quiz}/questions', [QuestionController::class, 'store'])->name('quizzes.questions.store');
    Route::put('/questions/{question}', [QuestionController::class, 'update'])->name('questions.update');
    Route::delete('/questions/{question}', [QuestionController::class, 'destroy'])->name('questions.destroy');

    // Quiz Attempts
    Route::post('/quizzes/{quiz}/attempts', [QuizAttemptController::class, 'start'])->name('quizzes.attempts.start');
    Route::get('/attempts/{attempt}', [QuizAttemptController::class, 'show'])->name('attempts.show');
    Route::post('/attempts/{attempt}/submit', [QuizAttemptController::class, 'submit'])->name('attempts.submit');
});

