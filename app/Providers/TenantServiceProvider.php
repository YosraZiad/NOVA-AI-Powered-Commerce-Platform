<?php

namespace App\Providers;

use App\Contracts\TenantContextInterface;
use App\Services\Tenant\TenantContext;
use App\Services\Tenant\TenantResolver;
use Illuminate\Support\ServiceProvider;

class TenantServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->scoped(TenantContext::class, function () {
            return new TenantContext();
        });
        $this->app->alias(TenantContext::class, TenantContextInterface::class);

        $this->app->singleton(TenantResolver::class, function () {
            return new TenantResolver();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
