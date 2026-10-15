<?php

namespace Tests\Feature;

use App\Contracts\TenantContextInterface;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\ProductCatalogSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantCatalogIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenantA;
    protected Tenant $tenantB;
    protected User $merchantA;
    protected User $merchantB;
    protected string $tokenA;
    protected string $tokenB;

    protected Category $categoryA;
    protected Category $categoryB;
    protected Product $productA;
    protected Product $productB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        // Tenant A
        $this->tenantA = Tenant::factory()->create(['name' => 'Store Alpha', 'status' => 'active']);
        $this->merchantA = User::factory()->create(['email' => 'alpha@merchant.test']);
        $this->merchantA->assignRole('Merchant');
        $this->merchantA->tenants()->attach($this->tenantA->id);
        $this->tokenA = $this->merchantA->createToken('auth-token')->plainTextToken;

        // Tenant B
        $this->tenantB = Tenant::factory()->create(['name' => 'Store Beta', 'status' => 'active']);
        $this->merchantB = User::factory()->create(['email' => 'beta@merchant.test']);
        $this->merchantB->assignRole('Merchant');
        $this->merchantB->tenants()->attach($this->tenantB->id);
        $this->tokenB = $this->merchantB->createToken('auth-token')->plainTextToken;

        // Populate catalog for Tenant A
        app(TenantContextInterface::class)->setTenant($this->tenantA);
        $this->categoryA = Category::factory()->create(['tenant_id' => $this->tenantA->id, 'name' => 'Alpha Category']);
        $this->productA = Product::factory()->create(['tenant_id' => $this->tenantA->id, 'name' => 'Alpha Product']);

        // Populate catalog for Tenant B
        app(TenantContextInterface::class)->setTenant($this->tenantB);
        $this->categoryB = Category::factory()->create(['tenant_id' => $this->tenantB->id, 'name' => 'Beta Category']);
        $this->productB = Product::factory()->create(['tenant_id' => $this->tenantB->id, 'name' => 'Beta Product']);

        // Reset context
        app(TenantContextInterface::class)->setTenant(null);
    }

    /**
     * Test: Cross-tenant product access attempts by ID manipulation return 404.
     */
    public function test_merchant_a_cannot_read_update_or_delete_tenant_b_product(): void
    {
        // 1. Read attempt
        $readResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson("/api/v1/products/{$this->productB->id}");
        $readResp->assertStatus(404);

        // 2. Update attempt
        $updateResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->putJson("/api/v1/products/{$this->productB->id}", [
                'name' => 'Hacked Beta Product',
            ]);
        $updateResp->assertStatus(404);
        $this->assertDatabaseMissing('products', ['name' => 'Hacked Beta Product']);

        // 3. Delete attempt
        $deleteResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->deleteJson("/api/v1/products/{$this->productB->id}");
        $deleteResp->assertStatus(404);
        $this->assertDatabaseHas('products', ['id' => $this->productB->id, 'deleted_at' => null]);
    }

    /**
     * Test: Cross-tenant category access attempts by ID manipulation return 404.
     */
    public function test_merchant_a_cannot_read_update_or_delete_tenant_b_category(): void
    {
        // 1. Read attempt
        $readResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson("/api/v1/categories/{$this->categoryB->id}");
        $readResp->assertStatus(404);

        // 2. Update attempt
        $updateResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->putJson("/api/v1/categories/{$this->categoryB->id}", [
                'name' => 'Hacked Beta Category',
            ]);
        $updateResp->assertStatus(404);

        // 3. Delete attempt
        $deleteResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->deleteJson("/api/v1/categories/{$this->categoryB->id}");
        $deleteResp->assertStatus(404);
    }

    /**
     * Test: Cross-tenant image or variant access attempts are denied.
     */
    public function test_merchant_a_cannot_access_tenant_b_images_or_variants(): void
    {
        $imageB = ProductImage::factory()->create(['product_id' => $this->productB->id]);
        $variantB = ProductVariant::factory()->create(['product_id' => $this->productB->id]);

        // Attempt listing images of Product B
        $imgListResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson("/api/v1/products/{$this->productB->id}/images");
        $imgListResp->assertStatus(404);

        // Attempt deleting image of Product B
        $imgDelResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->deleteJson("/api/v1/products/{$this->productB->id}/images/{$imageB->id}");
        $imgDelResp->assertStatus(404);

        // Attempt showing variant of Product B
        $varShowResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson("/api/v1/products/{$this->productB->id}/variants/{$variantB->id}");
        $varShowResp->assertStatus(404);

        // Attempt modifying variant of Product B
        $varUpdResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->putJson("/api/v1/products/{$this->productB->id}/variants/{$variantB->id}", [
                'price' => 1.00,
            ]);
        $varUpdResp->assertStatus(404);
    }

    /**
     * Test: Unauthenticated requests to catalog are denied with 401.
     */
    public function test_unauthenticated_requests_are_denied(): void
    {
        $this->getJson('/api/v1/categories')->assertStatus(401);
        $this->getJson('/api/v1/products')->assertStatus(401);
    }

    /**
     * Test: User without tenant membership is denied with 403.
     */
    public function test_user_without_tenant_membership_is_denied(): void
    {
        $orphanUser = User::factory()->create();
        $orphanUser->assignRole('Merchant');
        $orphanToken = $orphanUser->createToken('orphan-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$orphanToken}")
            ->getJson('/api/v1/products');

        $response->assertStatus(403);
    }

    /**
     * Test: User with inactive tenant is denied with 403.
     */
    public function test_user_with_inactive_tenant_is_denied(): void
    {
        $suspendedTenant = Tenant::factory()->create(['status' => 'suspended']);
        $suspendedMerchant = User::factory()->create();
        $suspendedMerchant->assignRole('Merchant');
        $suspendedMerchant->tenants()->attach($suspendedTenant->id);
        $token = $suspendedMerchant->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/products');

        $response->assertStatus(403);
    }

    /**
     * Test: Tenant A cannot list Tenant B's products or categories.
     */
    public function test_tenant_a_cannot_list_tenant_b_products_or_categories(): void
    {
        // 1. Products listing
        $prodResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson('/api/v1/products');

        $prodResp->assertStatus(200);
        $prodIds = collect($prodResp->json('data'))->pluck('id')->all();
        $this->assertContains($this->productA->id, $prodIds);
        $this->assertNotContains($this->productB->id, $prodIds);

        // 2. Categories listing
        $catResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson('/api/v1/categories');

        $catResp->assertStatus(200);
        $catIds = collect($catResp->json('data'))->pluck('id')->all();
        $this->assertContains($this->categoryA->id, $catIds);
        $this->assertNotContains($this->categoryB->id, $catIds);
    }

    /**
     * Test: Tenant A cannot assign Tenant B's category to its own product.
     */
    public function test_tenant_a_cannot_assign_tenant_b_category(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/v1/products', [
                'name' => 'Cross Category Exploit',
                'sku' => 'EXPLOIT-001',
                'price' => 50.00,
                'category_id' => $this->categoryB->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);

        $this->assertDatabaseMissing('products', [
            'sku' => 'EXPLOIT-001',
        ]);
    }

    /**
     * Test: Header manipulation cannot bypass tenant isolation.
     */
    public function test_header_manipulation_cannot_bypass_tenant_isolation(): void
    {
        // Header spoofing attempt targeting Tenant B
        $headerSpoofResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->withHeader('X-Tenant-ID', (string) $this->tenantB->id)
            ->getJson('/api/v1/products');

        $headerSpoofResp->assertStatus(403);
    }

    /**
     * Test: Query-string manipulation cannot bypass tenant isolation.
     */
    public function test_query_string_manipulation_cannot_bypass_tenant_isolation(): void
    {
        // Query string manipulation attempt
        $querySpoofResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson("/api/v1/products?tenant_id={$this->tenantB->id}");

        $querySpoofResp->assertStatus(200);
        $prodIds = collect($querySpoofResp->json('data'))->pluck('id')->all();
        $this->assertContains($this->productA->id, $prodIds);
        $this->assertNotContains($this->productB->id, $prodIds);
    }

    /**
     * Test: Cross-tenant variant and image ownership mismatch returns 404 and prevents mutation.
     */
    public function test_cross_tenant_variant_and_image_ownership_mismatch_returns_404_and_does_not_mutate_db(): void
    {
        $variantB = ProductVariant::factory()->create([
            'product_id' => $this->productB->id,
            'price' => 40.00,
            'sku' => 'VAR-B-ORIGINAL',
        ]);

        $imageB = ProductImage::factory()->create([
            'product_id' => $this->productB->id,
            'path' => 'tenants/b/img.jpg',
        ]);

        // Access variantB via productA URL
        $showResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson("/api/v1/products/{$this->productA->id}/variants/{$variantB->id}");
        $showResp->assertStatus(404);

        // Update variantB via productA URL
        $updResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->putJson("/api/v1/products/{$this->productA->id}/variants/{$variantB->id}", [
                'price' => 999.00,
            ]);
        $updResp->assertStatus(404);
        $this->assertDatabaseHas('product_variants', [
            'id' => $variantB->id,
            'price' => 40.00,
        ]);

        // Delete variantB via productA URL
        $delVarResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->deleteJson("/api/v1/products/{$this->productA->id}/variants/{$variantB->id}");
        $delVarResp->assertStatus(404);
        $this->assertDatabaseHas('product_variants', ['id' => $variantB->id]);

        // Delete imageB via productA URL
        $delImgResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->deleteJson("/api/v1/products/{$this->productA->id}/images/{$imageB->id}");
        $delImgResp->assertStatus(404);
        $this->assertDatabaseHas('product_images', ['id' => $imageB->id]);
    }

    /**
     * Test: Repeated seeder execution works cleanly and idempotently.
     */
    public function test_repeated_seeder_execution_is_idempotent(): void
    {
        // First run
        $this->seed(ProductCatalogSeeder::class);
        $prodCount1 = Product::count();
        $catCount1 = Category::count();

        // Second run
        $this->seed(ProductCatalogSeeder::class);
        $prodCount2 = Product::count();
        $catCount2 = Category::count();

        $this->assertEquals($prodCount1, $prodCount2);
        $this->assertEquals($catCount1, $catCount2);
    }
}
