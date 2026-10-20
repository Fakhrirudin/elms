<?php

use App\Modules\Learning\Controllers\EnrollmentController;
use App\Modules\Learning\Controllers\LearningProgressController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/courses/{course}/enroll', [EnrollmentController::class, 'enroll'])->name('courses.enroll');
    Route::get('/my-courses', [EnrollmentController::class, 'myCourses'])->name('my-courses.index');
    Route::get('/enrollments/{enrollment}', [EnrollmentController::class, 'show'])->name('enrollments.show');

    // Learning Progress
    // Learning Progress & Workspace
    Route::get('/enrollments/{enrollment}/progress', [LearningProgressController::class, 'progress'])->name('enrollments.progress');
    Route::post('/enrollments/{enrollment}/materials/{material}/complete', [LearningProgressController::class, 'complete'])->name('enrollments.materials.complete');
    Route::get('/enrollments/{enrollment}/materials/{material}/file', [LearningProgressController::class, 'streamMaterialFile'])->name('enrollments.materials.file');
    Route::get('/enrollments/{enrollment}/learning-overview', [LearningProgressController::class, 'learningOverview'])->name('enrollments.learning-overview');
    Route::get('/enrollments/{enrollment}/current-activity', [LearningProgressController::class, 'currentActivity'])->name('enrollments.current-activity');
    Route::post('/enrollments/{enrollment}/current-activity', [LearningProgressController::class, 'updateCurrentActivity'])->name('enrollments.current-activity.update');
    Route::post('/enrollments/{enrollment}/recalculate-progress', [LearningProgressController::class, 'recalculate'])->name('enrollments.recalculate');
});
