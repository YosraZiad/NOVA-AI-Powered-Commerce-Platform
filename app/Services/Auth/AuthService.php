<?php

namespace App\Services\Auth;

use App\Contracts\TenantContextInterface;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Tenant\TenantResolver;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        protected TenantContextInterface $tenantContext,
        protected TenantResolver $tenantResolver
    ) {}

    /**
     * Register a new user and return user instance with auth token.
     *
     * @param  array<string, mixed>  $data
     * @return array{user: User, token: string}
     */
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'phone' => $data['phone'] ?? null,
                'status' => 'active',
            ]);

            // Public registration strictly and exclusively creates Customer accounts.
            // Privileged roles (Platform Admin, Merchant, Staff) and Store creation
            // are restricted to authorized platform provisioning workflows.
            $user->assignRole('Customer');

            // Attach customer to specific store if registered within a storefront context
            $storeSlug = $data['store_slug'] ?? null;
            if ($storeSlug) {
                $tenant = Tenant::where('slug', $storeSlug)->first();
                if ($tenant && !$user->tenants()->where('tenants.id', $tenant->id)->exists()) {
                    $user->tenants()->attach($tenant->id);
                    $this->tenantContext->setTenant($tenant);
                }
            } elseif ($this->tenantContext->hasTenant()) {
                $activeTenant = $this->tenantContext->getTenant();
                if ($activeTenant && !$user->tenants()->where('tenants.id', $activeTenant->id)->exists()) {
                    $user->tenants()->attach($activeTenant->id);
                }
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            return [
                'user' => $user->load('tenants'),
                'token' => $token,
            ];
        });
    }

    /**
     * Authenticate a user and create an access token.
     *
     * @return array{user: User, token: string}
     *
     * @throws ValidationException
     */
    public function login(string $email, string $password, ?string $deviceName = null): array
    {
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => [trans('auth.failed')],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Your account is currently inactive.'],
            ]);
        }

        $resolution = $this->tenantResolver->resolve(request(), $user);
        if ($resolution['authorized'] && $resolution['tenant']) {
            $this->tenantContext->setTenant($resolution['tenant']);
        }

        $tokenName = $deviceName ?: 'auth-token';
        $token = $user->createToken($tokenName)->plainTextToken;

        return [
            'user' => $user->load('tenants'),
            'token' => $token,
        ];
    }

    /**
     * Revoke the current access token.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }
}
