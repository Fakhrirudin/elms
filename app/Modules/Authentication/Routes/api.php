<?php

use App\Modules\Authentication\Controllers\AuthenticationController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/login', [AuthenticationController::class, 'login'])
        ->middleware('throttle:login')
        ->name('login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthenticationController::class, 'logout'])->name('logout');
        Route::get('/me', [AuthenticationController::class, 'me'])->name('me');
    });
});
