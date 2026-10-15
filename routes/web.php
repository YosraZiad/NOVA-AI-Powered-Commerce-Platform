<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - SPA Catch-All
|--------------------------------------------------------------------------
| Serves the welcome view for all frontend routes (/platform, /merchant,
| /store/{slug}, /account) allowing the React Router to handle navigation.
*/

Route::get('/{any?}', function () {
    return view('welcome');
})->where('any', '.*');
