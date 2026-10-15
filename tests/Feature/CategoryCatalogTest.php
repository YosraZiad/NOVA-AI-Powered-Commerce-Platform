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

class CategoryCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $merchant;
    protected string $token;

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
    }

    /**
     * Test: Merchant can list categories.
     */
    public function test_merchant_can_list_categories(): void
    {
        Category::factory()->count(3)->create(['tenant_id' => $this->tenant->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/categories');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'slug', 'description', 'is_active', 'created_at', 'updated_at'],
                ],
            ]);
    }

    /**
     * Test: Merchant can create a category.
     */
    public function test_merchant_can_create_a_category(): void
    {
        $payload = [
            'name' => 'Smartphones',
            'slug' => 'smartphones',
            'description' => 'Flagship and budget phones.',
            'is_active' => true,
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/categories', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Category created successfully.',
                'category' => [
                    'name' => 'Smartphones',
                    'slug' => 'smartphones',
                    'is_active' => true,
                ],
            ]);

        $this->assertDatabaseHas('categories', [
            'tenant_id' => $this->tenant->id,
            'name' => 'Smartphones',
            'slug' => 'smartphones',
        ]);
    }

    /**
     * Test: Auto-generated slug when slug is omitted.
     */
    public function test_category_slug_is_automatically_generated_if_omitted(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/categories', [
                'name' => 'Gaming Consoles',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'category' => [
                    'name' => 'Gaming Consoles',
                    'slug' => 'gaming-consoles',
                ],
            ]);
    }

    /**
     * Test: Category slug uniqueness is scoped to tenant.
     */
    public function test_category_slug_uniqueness_is_scoped_to_tenant(): void
    {
        Category::factory()->create([
            'tenant_id' => $this->tenant->id,
            'slug' => 'electronics',
        ]);

        // Creating duplicate slug within same tenant should fail
        $dupResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/categories', [
                'name' => 'Consumer Electronics',
                'slug' => 'electronics',
            ]);

        $dupResp->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);

        // Same slug in another tenant should succeed
        $tenantB = Tenant::factory()->create();
        $merchantB = User::factory()->create();
        $merchantB->assignRole('Merchant');
        $merchantB->tenants()->attach($tenantB->id);
        $tokenB = $merchantB->createToken('auth-token')->plainTextToken;

        \Illuminate\Support\Facades\Auth::forgetGuards();

        $otherResp = $this->withHeader('Authorization', "Bearer {$tokenB}")
            ->postJson('/api/v1/categories', [
                'name' => 'Electronics Store B',
                'slug' => 'electronics',
            ]);

        $otherResp->assertStatus(201);
    }

    /**
     * Test: Merchant can update a category.
     */
    public function test_merchant_can_update_a_category(): void
    {
        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Old Category Name',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/v1/categories/{$category->id}", [
                'name' => 'Updated Category Name',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'category' => [
                    'name' => 'Updated Category Name',
                ],
            ]);
    }

    /**
     * Test: Safe category deletion prevents deletion when products reference the category.
     */
    public function test_safe_category_deletion_prevents_deletion_with_associated_products(): void
    {
        $category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
        Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'category_id' => $category->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/categories/{$category->id}");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category']);

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }

    /**
     * Test: Category with no associated products can be safely deleted.
     */
    public function test_category_can_be_deleted_when_no_products_are_associated(): void
    {
        $category = Category::factory()->create(['tenant_id' => $this->tenant->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/categories/{$category->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Category deleted successfully.',
            ]);

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    /**
     * Test: Customer cannot create or modify categories.
     */
    public function test_customer_cannot_create_or_modify_categories(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('Customer');
        $customer->tenants()->attach($this->tenant->id);
        $customerToken = $customer->createToken('customer-token')->plainTextToken;

        // Customer can view categories
        $viewResp = $this->withHeader('Authorization', "Bearer {$customerToken}")
            ->getJson('/api/v1/categories');
        $viewResp->assertStatus(200);

        // Customer cannot create categories
        $createResp = $this->withHeader('Authorization', "Bearer {$customerToken}")
            ->postJson('/api/v1/categories', ['name' => 'Forbidden']);
        $createResp->assertStatus(403);
    }
}
