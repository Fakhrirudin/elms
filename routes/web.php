<?php

use Illuminate\Support\Facades\Route;

require __DIR__.'/settings.php';

Route::get('/', function () {
    return view('app');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return view('app');
    })->name('dashboard');
});

Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$')->name('spa');
