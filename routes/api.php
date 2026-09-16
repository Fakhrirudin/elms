<?php

use App\Shared\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::get('/health', HealthController::class)->name('health');

    require app_path('Modules/Authentication/Routes/api.php');
    require app_path('Modules/Users/Routes/api.php');
    require app_path('Modules/Courses/Routes/api.php');
    require app_path('Modules/Learning/Routes/api.php');
    require app_path('Modules/Assessments/Routes/api.php');
    require app_path('Modules/Certificates/Routes/api.php');
    require app_path('Modules/Reports/Routes/api.php');
    require app_path('Modules/Notifications/Routes/api.php');
});
