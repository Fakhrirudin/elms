<?php

use App\Shared\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::get('/health', HealthController::class)->name('health');

    require app_path('Modules/Authentication/Routes/api.php');
    require app_path('Modules/Users/Routes/api.php');
});
