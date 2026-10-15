<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PlatformController extends Controller
{
    /**
     * Ensure the requesting user is a Platform Admin.
     */
    protected function authorizePlatformAdmin(Request $request): void
    {
        if (config('nova.deployment_mode') === 'standalone') {
            abort(Response::HTTP_NOT_FOUND, 'Platform administration is disabled in standalone mode.');
        }

        if (!$request->user() || !$request->user()->hasRole('Platform Admin')) {
            abort(Response::HTTP_FORBIDDEN, 'Access denied. Only Platform Administrators can access this resource.');
        }
    }

    /**
     * Get platform-wide metrics and operational health.
     */
    public function metrics(Request $request): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('status', 'active')->count();
        $suspendedTenants = Tenant::where('status', 'suspended')->count();
        $totalUsers = User::count();
        $totalProducts = Product::count();

        return response()->json([
            'metrics' => [
                'total_tenants' => $totalTenants,
                'active_tenants' => $activeTenants,
                'suspended_tenants' => $suspendedTenants,
                'total_users' => $totalUsers,
                'total_products' => $totalProducts,
                'system_status' => 'healthy',
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
            ]
        ]);
    }

    /**
     * List all platform tenants.
     */
    public function tenants(Request $request): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        $tenants = Tenant::withCount(['users', 'products'])
            ->latest()
            ->get();

        return response()->json([
            'data' => $tenants
        ]);
    }

    /**
     * Provision a new store tenant under Platform Admin control.
     */
    public function storeTenant(Request $request, \App\Services\Tenant\StoreProvisioningService $provisioningService): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:tenants,slug'],
            'currency' => ['nullable', 'string', 'size:3'],
            'description' => ['nullable', 'string', 'max:1000'],
            'owner_email' => ['required_without:owner_id', 'nullable', 'string', 'email', 'max:255'],
            'owner_name' => ['nullable', 'string', 'max:255'],
            'owner_password' => ['nullable', 'string', 'min:8'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $result = $provisioningService->provision($validated);

        return response()->json([
            'message' => 'Store provisioned successfully.',
            'tenant' => $result['tenant'],
            'owner' => [
                'id' => $result['owner']->id,
                'name' => $result['owner']->name,
                'email' => $result['owner']->email,
            ],
        ], Response::HTTP_CREATED);
    }

    /**
     * Update tenant status (e.g. active <-> suspended).
     */
    public function updateTenantStatus(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:active,suspended'],
        ]);

        $tenant->update(['status' => $validated['status']]);

        return response()->json([
            'message' => "Tenant status updated to {$tenant->status}.",
            'tenant' => $tenant
        ]);
    }

    /**
     * List platform users with their roles and tenants.
     */
    public function users(Request $request): JsonResponse
    {
        $this->authorizePlatformAdmin($request);

        $users = User::with(['roles', 'tenants'])
            ->latest()
            ->paginate(25);

        return response()->json($users);
    }
}
