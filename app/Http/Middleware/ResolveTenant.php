<?php

namespace App\Http\Middleware;

use App\Contracts\TenantContextInterface;
use App\Services\Tenant\TenantResolver;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function __construct(
        protected TenantContextInterface $tenantContext,
        protected TenantResolver $tenantResolver
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $resolution = $this->tenantResolver->resolve($request, $user);

        // Explicit tenant requested, but user is not a member of it
        if ($resolution['explicit'] && !$resolution['authorized']) {
            return response()->json([
                'message' => 'Unauthorized tenant access.',
            ], Response::HTTP_FORBIDDEN);
        }

        // No tenant resolved for the user
        if (!$resolution['authorized'] || !$resolution['tenant']) {
            return response()->json([
                'message' => 'No accessible tenant found for this user.',
            ], Response::HTTP_FORBIDDEN);
        }

        $tenant = $resolution['tenant'];

        if ($tenant->status !== 'active') {
            return response()->json([
                'message' => 'Tenant account is inactive.',
            ], Response::HTTP_FORBIDDEN);
        }

        // Store resolved tenant in request-lifecycle context
        $this->tenantContext->setTenant($tenant);

        return $next($request);
    }
}
