<?php

namespace Tests\Feature;

use App\Contracts\TenantContextInterface;
use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $merchant;
    protected string $token;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->tenant = Tenant::factory()->create(['name' => 'Store Alpha', 'status' => 'active']);
        $this->merchant = User::factory()->create(['name' => 'Merchant Alpha']);
        $this->merchant->assignRole('Merchant');
        $this->merchant->tenants()->attach($this->tenant->id);
        $this->token = $this->merchant->createToken('auth-token')->plainTextToken;

        app(TenantContextInterface::class)->setTenant($this->tenant);
        $this->category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    /**
     * Test: Merchant can create a product.
     */
    public function test_merchant_can_create_a_product(): void
    {
        $payload = [
            'name' => 'Noise Cancelling Headphones',
            'sku' => 'HEADPHONE-001',
            'price' => 199.99,
            'compare_at_price' => 249.99,
            'stock_quantity' => 45,
            'status' => 'active',
            'category_id' => $this->category->id,
            'description' => 'Crisp sound with active noise suppression.',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/products', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Product created successfully.',
                'product' => [
                    'name' => 'Noise Cancelling Headphones',
                    'sku' => 'HEADPHONE-001',
                    'price' => 199.99,
                    'compare_at_price' => 249.99,
                    'stock_quantity' => 45,
                    'status' => 'active',
                    'category_id' => $this->category->id,
                ],
            ]);

        $this->assertDatabaseHas('products', [
            'tenant_id' => $this->tenant->id,
            'sku' => 'HEADPHONE-001',
        ]);
    }

    /**
     * Test: SKU and Slug uniqueness is scoped to tenant.
     */
    public function test_product_sku_and_slug_uniqueness_is_tenant_scoped(): void
    {
        Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'sku' => 'UNIQUE-SKU',
            'slug' => 'unique-product',
        ]);

        // Duplicate SKU within same tenant fails
        $dupResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/products', [
                'name' => 'Second Product',
                'sku' => 'UNIQUE-SKU',
                'price' => 50.00,
            ]);

        $dupResp->assertStatus(422)
            ->assertJsonValidationErrors(['sku']);

        // Same SKU in another tenant succeeds
        $tenantB = Tenant::factory()->create();
        $merchantB = User::factory()->create();
        $merchantB->assignRole('Merchant');
        $merchantB->tenants()->attach($tenantB->id);
        $tokenB = $merchantB->createToken('auth-token')->plainTextToken;
        \Illuminate\Support\Facades\Auth::forgetGuards();

        $otherResp = $this->withHeader('Authorization', "Bearer {$tokenB}")
            ->postJson('/api/v1/products', [
                'name' => 'Product Store B',
                'sku' => 'UNIQUE-SKU',
                'slug' => 'unique-product',
                'price' => 50.00,
            ]);

        $otherResp->assertStatus(201);
    }

    /**
     * Test: Negative price is rejected.
     */
    public function test_negative_price_is_rejected(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/products', [
                'name' => 'Invalid Price Product',
                'sku' => 'INV-PRICE',
                'price' => -10.00,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['price']);
    }

    /**
     * Test: Negative stock quantity is rejected.
     */
    public function test_negative_stock_quantity_is_rejected(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/products', [
                'name' => 'Invalid Stock Product',
                'sku' => 'INV-STOCK',
                'price' => 20.00,
                'stock_quantity' => -5,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['stock_quantity']);
    }

    /**
     * Test: Compare-at price must be greater than or equal to price.
     */
    public function test_compare_at_price_must_satisfy_pricing_policy(): void
    {
        // Compare-at price lower than price must fail
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/products', [
                'name' => 'Invalid Discount Product',
                'sku' => 'INV-DISCOUNT',
                'price' => 100.00,
                'compare_at_price' => 80.00, // Invalid! Compare-at cannot be cheaper than price
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['compare_at_price']);
    }

    /**
     * Test: Assigning another tenant's category is rejected.
     */
    public function test_assigning_another_tenants_category_is_rejected(): void
    {
        $otherTenant = Tenant::factory()->create();
        $otherCategory = Category::factory()->create(['tenant_id' => $otherTenant->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/products', [
                'name' => 'Cross Category Product',
                'sku' => 'CROSS-CAT',
                'price' => 45.00,
                'category_id' => $otherCategory->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);
    }

    /**
     * Test: Client cannot inject or mutate tenant_id through payload.
     */
    public function test_client_cannot_inject_tenant_id_through_request_body(): void
    {
        $otherTenant = Tenant::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/products', [
                'name' => 'Injected Tenant Product',
                'sku' => 'INJECT-001',
                'price' => 30.00,
                'tenant_id' => $otherTenant->id, // Malicious injection
            ]);

        $response->assertStatus(201);

        $product = Product::where('sku', 'INJECT-001')->first();
        $this->assertNotNull($product);
        // Must belong to authenticated user's tenant, NOT otherTenant
        $this->assertEquals($this->tenant->id, $product->tenant_id);
        $this->assertNotEquals($otherTenant->id, $product->tenant_id);
    }

    /**
     * Test: Deleting product applies soft delete.
     */
    public function test_deleting_product_applies_soft_delete(): void
    {
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Product deleted successfully.',
            ]);

        $this->assertSoftDeleted('products', ['id' => $product->id]);

        // Omitted from index
        $listResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/products');

        $this->assertEmpty($listResp->json('data'));
    }

    /**
     * Test: Role-based authorization: Customer can view, but cannot modify products.
     */
    public function test_customer_can_view_but_cannot_modify_products(): void
    {
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id]);

        $customer = User::factory()->create();
        $customer->assignRole('Customer');
        $customer->tenants()->attach($this->tenant->id);
        $customerToken = $customer->createToken('customer-token')->plainTextToken;

        // View allowed
        $viewResp = $this->withHeader('Authorization', "Bearer {$customerToken}")
            ->getJson("/api/v1/products/{$product->id}");
        $viewResp->assertStatus(200);

        // Create forbidden
        $createResp = $this->withHeader('Authorization', "Bearer {$customerToken}")
            ->postJson('/api/v1/products', [
                'name' => 'Forbidden Product',
                'sku' => 'FORBIDDEN',
                'price' => 10.00,
            ]);
        $createResp->assertStatus(403);

        // Delete forbidden
        $deleteResp = $this->withHeader('Authorization', "Bearer {$customerToken}")
            ->deleteJson("/api/v1/products/{$product->id}");
        $deleteResp->assertStatus(403);
    }
}
