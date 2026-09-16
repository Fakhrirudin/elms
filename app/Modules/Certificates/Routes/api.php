<?php

use App\Modules\Certificates\Controllers\CertificateController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/enrollments/{enrollment}/certificate', [CertificateController::class, 'issue'])->name('enrollments.certificate.issue');
    Route::get('/my-certificates', [CertificateController::class, 'myCertificates'])->name('my-certificates.index');
    Route::get('/certificates', [CertificateController::class, 'index'])->name('certificates.index');
    Route::get('/certificates/{certificate}', [CertificateController::class, 'show'])->name('certificates.show');
});
