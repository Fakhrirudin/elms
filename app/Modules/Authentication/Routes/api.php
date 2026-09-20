<?php

use App\Modules\Authentication\Controllers\AuthenticationController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/login', [AuthenticationController::class, 'login'])
        ->middleware('throttle:login')
        ->name('login');

    Route::post('/register', [AuthenticationController::class, 'register'])
        ->name('register');

    Route::post('/forgot-password', [AuthenticationController::class, 'forgotPassword'])
        ->name('forgot-password');

    Route::post('/reset-password', [AuthenticationController::class, 'resetPassword'])
        ->name('reset-password');

    Route::get('/departments', [AuthenticationController::class, 'departments'])
        ->name('departments');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthenticationController::class, 'logout'])->name('logout');
        Route::get('/me', [AuthenticationController::class, 'me'])->name('me');
    });
});
