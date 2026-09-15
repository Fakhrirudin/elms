<?php

use App\Modules\Courses\Controllers\CategoryController;
use App\Modules\Courses\Controllers\CourseController;
use App\Modules\Courses\Controllers\CourseInstructorController;
use App\Modules\Courses\Controllers\MaterialController;
use App\Modules\Courses\Controllers\ModuleController;
use Illuminate\Support\Facades\Route;

// Categories (Admin only)
Route::middleware(['auth:sanctum', 'role:SUPER_ADMIN,LEARNING_ADMIN'])
    ->prefix('categories')
    ->name('categories.')
    ->group(function () {
        Route::get('/', [CategoryController::class, 'index'])->name('index');
        Route::post('/', [CategoryController::class, 'store'])->name('store');
        Route::get('/{category}', [CategoryController::class, 'show'])->name('show');
        Route::match(['put', 'patch'], '/{category}', [CategoryController::class, 'update'])->name('update');
        Route::delete('/{category}', [CategoryController::class, 'destroy'])->name('destroy');
    });

// Courses (Authenticated)
Route::middleware('auth:sanctum')
    ->prefix('courses')
    ->name('courses.')
    ->group(function () {
        Route::get('/', [CourseController::class, 'index'])->name('index');
        Route::post('/', [CourseController::class, 'store'])->name('store');
        Route::get('/{course}', [CourseController::class, 'show'])->name('show');
        Route::match(['put', 'patch'], '/{course}', [CourseController::class, 'update'])->name('update');
        Route::delete('/{course}', [CourseController::class, 'destroy'])->name('destroy');
        Route::patch('/{course}/status', [CourseController::class, 'updateStatus'])->name('status');

        // Course Instructors
        Route::get('/{course}/instructors', [CourseInstructorController::class, 'index'])->name('instructors.index');
        Route::post('/{course}/instructors', [CourseInstructorController::class, 'store'])->name('instructors.store');
        Route::put('/{course}/instructors', [CourseInstructorController::class, 'sync'])->name('instructors.sync');
        Route::delete('/{course}/instructors/{user}', [CourseInstructorController::class, 'destroy'])->name('instructors.destroy');

        // Course Modules
        Route::get('/{course}/modules', [ModuleController::class, 'index'])->name('modules.index');
        Route::post('/{course}/modules', [ModuleController::class, 'store'])->name('modules.store');
        Route::patch('/{course}/modules/reorder', [ModuleController::class, 'reorder'])->name('modules.reorder');
    });

// Modules (Authenticated)
Route::middleware('auth:sanctum')
    ->prefix('modules')
    ->name('modules.')
    ->group(function () {
        Route::get('/{module}', [ModuleController::class, 'show'])->name('show');
        Route::match(['put', 'patch'], '/{module}', [ModuleController::class, 'update'])->name('update');
        Route::delete('/{module}', [ModuleController::class, 'destroy'])->name('destroy');

        // Module Materials
        Route::get('/{module}/materials', [MaterialController::class, 'index'])->name('materials.index');
        Route::post('/{module}/materials', [MaterialController::class, 'store'])->name('materials.store');
        Route::patch('/{module}/materials/reorder', [MaterialController::class, 'reorder'])->name('materials.reorder');
    });

// Materials (Authenticated)
Route::middleware('auth:sanctum')
    ->prefix('materials')
    ->name('materials.')
    ->group(function () {
        Route::get('/{material}', [MaterialController::class, 'show'])->name('show');
        Route::match(['put', 'patch', 'post'], '/{material}', [MaterialController::class, 'update'])->name('update');
        Route::delete('/{material}', [MaterialController::class, 'destroy'])->name('destroy');
    });
