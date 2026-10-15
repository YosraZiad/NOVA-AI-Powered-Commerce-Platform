<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\TenantContextInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Services\Auth\AuthService;
use App\Services\Tenant\TenantResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService,
        protected TenantContextInterface $tenantContext,
        protected TenantResolver $tenantResolver
    ) {}

    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return response()->json([
            'message' => 'User registered successfully.',
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
        ], Response::HTTP_CREATED);
    }

    /**
     * Authenticate user and issue access token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            email: $request->validated('email'),
            password: $request->validated('password'),
            deviceName: $request->validated('device_name')
        );

        return response()->json([
            'message' => 'Login successful.',
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
        ], Response::HTTP_OK);
    }

    /**
     * Revoke current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'message' => 'Logged out successfully.',
        ], Response::HTTP_OK);
    }

    /**
     * Get authenticated user profile with roles and tenant context.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('tenants');

        $resolution = $this->tenantResolver->resolve($request, $user);

        // Reject request if user explicitly requested an unauthorized tenant
        if ($resolution['explicit'] && !$resolution['authorized']) {
            return response()->json([
                'message' => 'Unauthorized tenant access.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($resolution['authorized'] && $resolution['tenant']) {
            $this->tenantContext->setTenant($resolution['tenant']);
        }

        return response()->json([
            'user' => new UserResource($user),
        ], Response::HTTP_OK);
    }
}
