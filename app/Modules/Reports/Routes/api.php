<?php

use App\Modules\Reports\Controllers\DashboardController;
use App\Modules\Reports\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index');
    Route::get('/reports/courses', [ReportController::class, 'courses'])->name('reports.courses');
    Route::get('/reports/learning', [ReportController::class, 'learning'])->name('reports.learning');
    Route::get('/reports/quiz', [ReportController::class, 'quiz'])->name('reports.quiz');
});

