<?php

namespace App\Services\Tenant;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;

class TenantResolver
{
    /**
     * Resolve tenant for the given request and user.
     *
     * @return array{tenant: ?Tenant, explicit: bool, authorized: bool}
     */
    public function resolve(Request $request, User $user): array
    {
        // Standalone Mode: Single-store installation resolves the local store immediately
        if (config('nova.deployment_mode') === 'standalone') {
            $standaloneTenant = Tenant::where('status', 'active')->first() ?? Tenant::first();
            return [
                'tenant' => $standaloneTenant,
                'explicit' => false,
                'authorized' => $standaloneTenant !== null,
            ];
        }

        $explicitId = $request->header('X-Tenant-ID');
        $explicitSlug = $request->header('X-Tenant-Slug');
        $routeParam = $request->route('tenant') ?? $request->route('tenant_id') ?? $request->route('tenant_slug');

        if ($routeParam instanceof Tenant) {
            $routeParam = $routeParam->id;
        }

        // Case 1: Explicit Tenant ID via header
        if (!empty($explicitId)) {
            $tenant = $user->tenants()->where('tenants.id', $explicitId)->first();
            return [
                'tenant' => $tenant,
                'explicit' => true,
                'authorized' => $tenant !== null,
            ];
        }

        // Case 2: Explicit Tenant Slug via header
        if (!empty($explicitSlug)) {
            $tenant = $user->tenants()->where('tenants.slug', $explicitSlug)->first();
            return [
                'tenant' => $tenant,
                'explicit' => true,
                'authorized' => $tenant !== null,
            ];
        }

        // Case 3: Explicit Tenant via route parameter
        if (!empty($routeParam)) {
            $tenant = $user->tenants()
                ->where(function ($query) use ($routeParam) {
                    $query->where('tenants.id', $routeParam)
                          ->orWhere('tenants.slug', $routeParam);
                })
                ->first();

            return [
                'tenant' => $tenant,
                'explicit' => true,
                'authorized' => $tenant !== null,
            ];
        }

        // Case 4: Default fallback for MVP (first tenant belonging to authenticated user)
        $defaultTenant = $user->tenants()->first();

        return [
            'tenant' => $defaultTenant,
            'explicit' => false,
            'authorized' => $defaultTenant !== null,
        ];
    }
}
