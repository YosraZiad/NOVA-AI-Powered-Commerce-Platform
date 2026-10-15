<?php

namespace Tests\Feature;

use App\Contracts\TenantContextInterface;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenantA;
    protected Tenant $tenantB;
    protected User $merchantA;
    protected User $merchantB;
    protected string $tokenA;
    protected string $tokenB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        // Tenant A and Merchant A
        $this->tenantA = Tenant::factory()->create([
            'name' => 'Store Alpha',
            'slug' => 'store-alpha',
            'status' => 'active',
        ]);
        $this->merchantA = User::factory()->create([
            'name' => 'Merchant Alpha',
            'email' => 'alpha@merchant.test',
        ]);
        $this->merchantA->assignRole('Merchant');
        $this->merchantA->tenants()->attach($this->tenantA->id);
        $this->tokenA = $this->merchantA->createToken('auth-token')->plainTextToken;

        // Tenant B and Merchant B
        $this->tenantB = Tenant::factory()->create([
            'name' => 'Store Beta',
            'slug' => 'store-beta',
            'status' => 'active',
        ]);
        $this->merchantB = User::factory()->create([
            'name' => 'Merchant Beta',
            'email' => 'beta@merchant.test',
        ]);
        $this->merchantB->assignRole('Merchant');
        $this->merchantB->tenants()->attach($this->tenantB->id);
        $this->tokenB = $this->merchantB->createToken('auth-token')->plainTextToken;
    }

    /**
     * Attack Path 1: Direct tenant ID manipulation via header.
     * Merchant A attempts to query Tenant B's context using Tenant B's ID.
     */
    public function test_merchant_a_cannot_access_tenant_b_via_tenant_id_manipulation(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->withHeader('X-Tenant-ID', (string) $this->tenantB->id)
            ->getJson('/api/v1/tenant/current');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized tenant access.',
            ]);

        // Verify Tenant B information was not leaked in response
        $this->assertStringNotContainsString('Store Beta', $response->getContent());
        $this->assertStringNotContainsString('store-beta', $response->getContent());
    }

    /**
     * Attack Path 2: Direct tenant slug manipulation via header.
     * Merchant A attempts to access Tenant B using Tenant B's slug.
     */
    public function test_merchant_a_cannot_access_tenant_b_via_tenant_slug_manipulation(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->withHeader('X-Tenant-Slug', $this->tenantB->slug)
            ->getJson('/api/v1/tenant/current');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized tenant access.',
            ]);

        $this->assertStringNotContainsString('Store Beta', $response->getContent());
    }

    /**
     * Attack Path 3: Unauthorized tenant switching.
     * Merchant A belongs only to Tenant A, attempting to switch to Tenant B must fail
     * and request context must NOT be polluted with Tenant B.
     */
    public function test_unauthorized_tenant_switching_is_denied_and_context_preserved(): void
    {
        $context = app(TenantContextInterface::class);

        // Request with unauthorized tenant
        $response = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->withHeader('X-Tenant-ID', (string) $this->tenantB->id)
            ->getJson('/api/v1/tenant/current');

        $response->assertStatus(403);

        // Ensure context was not compromised with Tenant B
        $this->assertNotEquals($this->tenantB->id, $context->id());
    }

    /**
     * Attack Path 4: Client passes arbitrary tenant_id in query params.
     * Tenant resolution must NOT blindly trust arbitrary tenant_id in query.
     */
    public function test_arbitrary_query_parameter_tenant_id_is_not_trusted(): void
    {
        // Merchant A passes ?tenant_id={Tenant B} in query string
        $response = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson('/api/v1/tenant/current?tenant_id=' . $this->tenantB->id);

        $response->assertStatus(200);

        // Response must resolve Merchant A's authorized tenant (Store Alpha), NOT Tenant B
        $this->assertEquals($this->tenantA->id, $response->json('tenant.id'));
        $this->assertEquals('Store Alpha', $response->json('tenant.name'));
        $this->assertNotEquals($this->tenantB->id, $response->json('tenant.id'));
    }

    /**
     * Attack Path 5: Missing authentication (anonymous access).
     * Requests without token targeting tenant endpoints must be rejected with 401.
     */
    public function test_anonymous_requests_to_tenant_endpoints_are_denied(): void
    {
        $response = $this->getJson('/api/v1/tenant/current');

        $response->assertStatus(401);
    }

    /**
     * Attack Path 6: User with no tenant memberships attempting tenant endpoint.
     */
    public function test_user_without_tenant_membership_is_denied(): void
    {
        $unassociatedUser = User::factory()->create();
        $unassociatedUser->assignRole('Platform Admin');
        $token = $unassociatedUser->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/tenant/current');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'No accessible tenant found for this user.',
            ]);
    }

    /**
     * Attack Path 7: Inactive / Suspended tenant access is rejected.
     */
    public function test_suspended_tenant_access_is_rejected(): void
    {
        $suspendedTenant = Tenant::factory()->create([
            'name' => 'Suspended Store',
            'status' => 'suspended',
        ]);

        $merchant = User::factory()->create();
        $merchant->assignRole('Merchant');
        $merchant->tenants()->attach($suspendedTenant->id);

        $token = $merchant->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/tenant/current');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Tenant account is inactive.',
            ]);
    }

    /**
     * Attack Path 8: Profile endpoint /api/v1/auth/me rejects unauthorized tenant spoofing.
     */
    public function test_auth_me_rejects_unauthorized_tenant_header_spoofing(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->withHeader('X-Tenant-ID', (string) $this->tenantB->id)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized tenant access.',
            ]);
    }

    /**
     * Verification: Merchant A accesses own tenant accurately.
     */
    public function test_merchant_a_accesses_own_tenant_accurately(): void
    {
        $respA = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson('/api/v1/tenant/current');

        $respA->assertStatus(200)
            ->assertJson([
                'tenant' => [
                    'id' => $this->tenantA->id,
                    'name' => 'Store Alpha',
                    'slug' => 'store-alpha',
                ],
            ]);
    }

    /**
     * Verification: Merchant B accesses own tenant accurately.
     */
    public function test_merchant_b_accesses_own_tenant_accurately(): void
    {
        $respB = $this->withHeader('Authorization', "Bearer {$this->tokenB}")
            ->getJson('/api/v1/tenant/current');

        $respB->assertStatus(200)
            ->assertJson([
                'tenant' => [
                    'id' => $this->tenantB->id,
                    'name' => 'Store Beta',
                    'slug' => 'store-beta',
                ],
            ]);
    }
}
