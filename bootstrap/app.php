<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Global production security headers on all responses
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);

        // Configurable trusted proxies for reverse proxy / load balancer deployments
        if (env('TRUSTED_PROXIES')) {
            $middleware->trustProxies(at: env('TRUSTED_PROXIES'));
        }

        $middleware->alias([
            'tenant' => \App\Http\Middleware\ResolveTenant::class,
        ]);

        $middleware->priority([
            \Illuminate\Auth\Middleware\Authenticate::class,
            \App\Http\Middleware\ResolveTenant::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function (\Illuminate\Http\Request $request, \Throwable $e) {
            return $request->is('api/*') || $request->expectsJson();
        });

        // Prevent database queries or schema internals from leaking to clients when debug is disabled
        $exceptions->render(function (\Illuminate\Database\QueryException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                if (!config('app.debug')) {
                    \Illuminate\Support\Facades\Log::error('Database Query Exception: ' . $e->getMessage(), [
                        'sql' => $e->getSql(),
                    ]);

                    return response()->json([
                        'message' => 'A database error occurred. The technical team has been notified.',
                        'error_code' => 'DATABASE_ERROR',
                    ], 500);
                }
            }
        });
    })->create();
