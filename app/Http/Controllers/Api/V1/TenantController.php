<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\TenantContextInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\TenantResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class TenantController extends Controller
{
    public function __construct(
        protected TenantContextInterface $tenantContext
    ) {}

    /**
     * Get the currently active tenant resolved by middleware.
     */
    public function current(): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        if (!$tenant) {
            return response()->json([
                'message' => 'No active tenant in context.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'tenant' => new TenantResource($tenant),
        ], Response::HTTP_OK);
    }
}
