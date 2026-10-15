<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformAndStorefrontSeparationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /**
     * Test: Platform Admin can access platform metrics and tenant directory.
     */
    public function test_platform_admin_can_access_platform_management_endpoints(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Platform Admin');

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/platform/metrics');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'metrics' => [
                    'total_tenants',
                    'active_tenants',
                    'suspended_tenants',
                    'total_users',
                    'total_products',
                ],
            ]);

        $tenantsResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/platform/tenants');
        $tenantsResponse->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /**
     * Test: Merchants and Customers receive 403 Forbidden on platform endpoints.
     */
    public function test_non_platform_admin_users_receive_forbidden_on_platform_endpoints(): void
    {
        // Merchant attempt
        $merchant = User::factory()->create();
        $merchant->assignRole('Merchant');
        $this->actingAs($merchant, 'sanctum')->getJson('/api/v1/platform/metrics')
            ->assertStatus(403);

        // Customer attempt
        $customer = User::factory()->create();
        $customer->assignRole('Customer');
        $this->actingAs($customer, 'sanctum')->getJson('/api/v1/platform/tenants')
            ->assertStatus(403);
    }

    /**
     * Test: Unauthenticated requests receive 401 Unauthorized on platform endpoints.
     */
    public function test_unauthenticated_requests_receive_unauthorized_on_platform_endpoints(): void
    {
        $this->getJson('/api/v1/platform/metrics')
            ->assertStatus(401);
    }

    /**
     * Test: Public storefront endpoints return scoped catalog without auth.
     */
    public function test_public_can_access_tenant_scoped_storefront_catalog(): void
    {
        $tenantA = Tenant::factory()->create([
            'name' => 'Store Alpha',
            'slug' => 'store-alpha',
            'status' => 'active',
        ]);

        $tenantB = Tenant::factory()->create([
            'name' => 'Store Beta',
            'slug' => 'store-beta',
            'status' => 'active',
        ]);

        $categoryA = Category::factory()->create([
            'tenant_id' => $tenantA->id,
            'name' => 'Alpha Category',
            'slug' => 'alpha-category',
            'is_active' => true,
        ]);

        $productA = Product::factory()->create([
            'tenant_id' => $tenantA->id,
            'category_id' => $categoryA->id,
            'name' => 'Alpha Product 1',
            'slug' => 'alpha-product-1',
            'sku' => 'SKU-A1',
            'price' => 120.00,
            'stock_quantity' => 15,
            'status' => 'active',
        ]);

        $categoryB = Category::factory()->create([
            'tenant_id' => $tenantB->id,
            'name' => 'Beta Category',
            'slug' => 'beta-category',
            'is_active' => true,
        ]);

        $productB = Product::factory()->create([
            'tenant_id' => $tenantB->id,
            'category_id' => $categoryB->id,
            'name' => 'Beta Product 1',
            'slug' => 'beta-product-1',
            'sku' => 'SKU-B1',
            'price' => 250.00,
            'stock_quantity' => 8,
            'status' => 'active',
        ]);

        // Query Store Alpha storefront public API
        $response = $this->getJson('/api/v1/storefront/store-alpha/products');
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $productA->id)
            ->assertJsonPath('data.0.name', 'Alpha Product 1');

        // Verify Store Alpha categories API
        $catResponse = $this->getJson('/api/v1/storefront/store-alpha/categories');
        $catResponse->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Alpha Category');

        // Query Non-existent or suspended store
        $this->getJson('/api/v1/storefront/non-existent-store/products')
            ->assertStatus(404);
    }

    /**
     * Test: Standalone mode disables platform administration endpoints.
     */
    public function test_standalone_mode_disables_platform_administration_endpoints(): void
    {
        config(['nova.deployment_mode' => 'standalone']);

        $admin = User::factory()->create();
        $admin->assignRole('Platform Admin');

        $this->actingAs($admin, 'sanctum')->getJson('/api/v1/platform/metrics')
            ->assertStatus(404);
    }

    /**
     * Test: Standalone mode resolves the local store automatically without headers.
     */
    public function test_standalone_mode_resolves_local_tenant_automatically(): void
    {
        config(['nova.deployment_mode' => 'standalone']);

        $localStore = Tenant::factory()->create([
            'name' => 'Standalone Store',
            'slug' => 'standalone-store',
            'status' => 'active',
        ]);

        $merchant = User::factory()->create();
        $merchant->assignRole('Merchant');
        $merchant->tenants()->attach($localStore->id);

        $response = $this->actingAs($merchant, 'sanctum')->getJson('/api/v1/tenant/current');
        $response->assertStatus(200)
            ->assertJsonPath('tenant.id', $localStore->id)
            ->assertJsonPath('tenant.name', 'Standalone Store');
    }
}
