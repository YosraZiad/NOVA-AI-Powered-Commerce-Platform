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

class ProductFilterAndSearchTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $merchant;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->tenant = Tenant::factory()->create(['status' => 'active']);
        $this->merchant = User::factory()->create();
        $this->merchant->assignRole('Merchant');
        $this->merchant->tenants()->attach($this->tenant->id);
        $this->token = $this->merchant->createToken('auth-token')->plainTextToken;

        app(TenantContextInterface::class)->setTenant($this->tenant);
    }

    /**
     * Test: Product search by name, SKU, and description.
     */
    public function test_product_search_filters_correctly(): void
    {
        Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Apple MacBook Pro',
            'sku' => 'LAPTOP-MAC-01',
            'description' => 'M3 chip powerful laptop',
        ]);

        Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Dell XPS Laptop',
            'sku' => 'LAPTOP-DELL-01',
            'description' => 'Intel Core i9 laptop',
        ]);

        Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Sony Wireless Headphones',
            'sku' => 'AUDIO-SONY-01',
            'description' => 'Premium sound',
        ]);

        // Search by name
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/products?search=MacBook');
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Apple MacBook Pro');

        // Search by SKU
        $responseSku = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/products?search=LAPTOP-DELL');
        $responseSku->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.sku', 'LAPTOP-DELL-01');

        // Search by description keyword
        $responseDesc = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/products?search=laptop');
        $responseDesc->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    /**
     * Test: Filter by category_id.
     */
    public function test_filter_by_category(): void
    {
        $cat1 = Category::factory()->create(['tenant_id' => $this->tenant->id]);
        $cat2 = Category::factory()->create(['tenant_id' => $this->tenant->id]);

        Product::factory()->create(['tenant_id' => $this->tenant->id, 'category_id' => $cat1->id]);
        Product::factory()->create(['tenant_id' => $this->tenant->id, 'category_id' => $cat1->id]);
        Product::factory()->create(['tenant_id' => $this->tenant->id, 'category_id' => $cat2->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/v1/products?category_id={$cat1->id}");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    /**
     * Test: Filter by min_price and max_price.
     */
    public function test_filter_by_price_range(): void
    {
        Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 20.00]);
        Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 50.00]);
        Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 100.00]);
        Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 150.00]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/products?min_price=40&max_price=120');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    /**
     * Test: Filter by status.
     */
    public function test_filter_by_status(): void
    {
        Product::factory()->create(['tenant_id' => $this->tenant->id, 'status' => 'active']);
        Product::factory()->create(['tenant_id' => $this->tenant->id, 'status' => 'draft']);
        Product::factory()->create(['tenant_id' => $this->tenant->id, 'status' => 'archived']);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/products?status=draft');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'draft');
    }

    /**
     * Test: Sorting by allowlist columns.
     */
    public function test_sorting_by_price_and_direction(): void
    {
        Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 10.00, 'name' => 'Cheap']);
        Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 90.00, 'name' => 'Expensive']);
        Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 50.00, 'name' => 'Moderate']);

        // Ascending
        $ascResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/products?sort_by=price&sort_direction=asc');
        $ascResp->assertStatus(200);
        $this->assertEquals(10.00, $ascResp->json('data.0.price'));
        $this->assertEquals(90.00, $ascResp->json('data.2.price'));

        // Descending
        $descResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/products?sort_by=price&sort_direction=desc');
        $descResp->assertStatus(200);
        $this->assertEquals(90.00, $descResp->json('data.0.price'));
        $this->assertEquals(10.00, $descResp->json('data.2.price'));
    }

    /**
     * Test: Pagination returns expected metadata and limits.
     */
    public function test_product_pagination(): void
    {
        Product::factory()->count(15)->create(['tenant_id' => $this->tenant->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/products?per_page=5&page=1');

        $response->assertStatus(200)
            ->assertJsonCount(5, 'data')
            ->assertJsonStructure([
                'data',
                'links',
                'meta' => ['current_page', 'from', 'last_page', 'per_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 15)
            ->assertJsonPath('meta.per_page', 5);
    }
}
