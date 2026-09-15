<?php

use App\Modules\Learning\Controllers\EnrollmentController;
use App\Modules\Learning\Controllers\LearningProgressController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/courses/{course}/enroll', [EnrollmentController::class, 'enroll'])->name('courses.enroll');
    Route::get('/my-courses', [EnrollmentController::class, 'myCourses'])->name('my-courses.index');
    Route::get('/enrollments/{enrollment}', [EnrollmentController::class, 'show'])->name('enrollments.show');

    // Learning Progress
    Route::get('/enrollments/{enrollment}/progress', [LearningProgressController::class, 'progress'])->name('enrollments.progress');
    Route::post('/enrollments/{enrollment}/materials/{material}/complete', [LearningProgressController::class, 'complete'])->name('enrollments.materials.complete');
});
