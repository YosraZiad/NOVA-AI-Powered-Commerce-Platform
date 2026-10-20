<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\TenantContextInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Tenant\UpdateTenantSettingsRequest;
use App\Http\Resources\Api\V1\TenantResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class MerchantSettingsController extends Controller
{
    public function __construct(
        protected TenantContextInterface $tenantContext
    ) {}

    /**
     * Display the settings for the current active tenant.
     */
    public function show(): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        if (!$tenant) {
            return response()->json(['message' => 'No active tenant in context.'], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'tenant' => new TenantResource($tenant),
            'settings' => $tenant->settings ?: [
                'contact_email' => null,
                'contact_phone' => null,
                'contact_address' => null,
                'low_stock_threshold' => 5,
                'shipping_policy' => null,
                'return_policy' => null,
            ],
        ]);
    }

    /**
     * Update store settings for the current active tenant.
     */
    public function update(UpdateTenantSettingsRequest $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        if (!$tenant) {
            return response()->json(['message' => 'No active tenant in context.'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validated();

        if (isset($validated['name'])) {
            $tenant->name = $validated['name'];
        }
        if (array_key_exists('description', $validated)) {
            $tenant->description = $validated['description'];
        }
        if (array_key_exists('logo', $validated)) {
            $tenant->logo = $validated['logo'];
        }
        if (isset($validated['currency'])) {
            $tenant->currency = $validated['currency'];
        }

        if (isset($validated['settings'])) {
            $currentSettings = $tenant->settings ?: [];
            $tenant->settings = array_merge($currentSettings, $validated['settings']);
        }

        $tenant->save();

        return response()->json([
            'message' => 'Store settings updated successfully.',
            'tenant' => new TenantResource($tenant),
            'settings' => $tenant->settings,
        ], Response::HTTP_OK);
    }
}
