<?php

use App\Modules\Assessments\Controllers\AssignmentController;
use App\Modules\Assessments\Controllers\AssignmentSubmissionController;
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

    // Assignments
    Route::get('/modules/{module}/assignments', [AssignmentController::class, 'index'])->name('modules.assignments.index');
    Route::post('/modules/{module}/assignments', [AssignmentController::class, 'store'])->name('modules.assignments.store');
    Route::get('/assignments/{assignment}', [AssignmentController::class, 'show'])->name('assignments.show');
    Route::match(['put', 'patch'], '/assignments/{assignment}', [AssignmentController::class, 'update'])->name('assignments.update');
    Route::delete('/assignments/{assignment}', [AssignmentController::class, 'destroy'])->name('assignments.destroy');
    Route::post('/assignments/{assignment}/publish', [AssignmentController::class, 'publish'])->name('assignments.publish');
    Route::post('/assignments/{assignment}/close', [AssignmentController::class, 'close'])->name('assignments.close');

    // Assignment Submissions
    Route::post('/assignments/{assignment}/submissions', [AssignmentSubmissionController::class, 'store'])->name('assignments.submissions.store');
    Route::get('/assignments/{assignment}/my-submissions', [AssignmentSubmissionController::class, 'mySubmissions'])->name('assignments.submissions.my');
    Route::get('/assignments/{assignment}/submissions', [AssignmentSubmissionController::class, 'index'])->name('assignments.submissions.index');
    Route::get('/assignment-submissions/{submission}', [AssignmentSubmissionController::class, 'show'])->name('assignment-submissions.show');
    Route::post('/assignment-submissions/{submission}/start-review', [AssignmentSubmissionController::class, 'startReview'])->name('assignment-submissions.start-review');
    Route::post('/assignment-submissions/{submission}/review', [AssignmentSubmissionController::class, 'review'])->name('assignment-submissions.review');
    Route::get('/assignment-submissions/{submission}/download', [AssignmentSubmissionController::class, 'download'])->name('assignment-submissions.download');
});
