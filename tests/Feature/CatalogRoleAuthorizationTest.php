<?php

namespace Tests\Feature;

use App\Contracts\TenantContextInterface;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CatalogRoleAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $customer;
    protected User $staff;
    protected User $merchant;
    protected string $customerToken;
    protected string $staffToken;
    protected string $merchantToken;

    protected Category $category;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        Storage::fake('public');

        $this->tenant = Tenant::factory()->create(['status' => 'active']);

        // 1. Customer
        $this->customer = User::factory()->create(['email' => 'customer@test.com']);
        $this->customer->assignRole('Customer');
        $this->customer->tenants()->attach($this->tenant->id);
        $this->customerToken = $this->customer->createToken('customer-token')->plainTextToken;

        // 2. Staff
        $this->staff = User::factory()->create(['email' => 'staff@test.com']);
        $this->staff->assignRole('Staff');
        $this->staff->tenants()->attach($this->tenant->id);
        $this->staffToken = $this->staff->createToken('staff-token')->plainTextToken;

        // 3. Merchant
        $this->merchant = User::factory()->create(['email' => 'merchant@test.com']);
        $this->merchant->assignRole('Merchant');
        $this->merchant->tenants()->attach($this->tenant->id);
        $this->merchantToken = $this->merchant->createToken('merchant-token')->plainTextToken;

        // Populate base catalog records
        app(TenantContextInterface::class)->setTenant($this->tenant);
        $this->category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
        ]);
    }

    /**
     * Test: Customer can view products and categories, but cannot create, update, or delete.
     */
    public function test_customer_role_permissions_boundary(): void
    {
        // 1. Can view products list
        $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->getJson('/api/v1/products')
            ->assertStatus(200);

        // 2. Can view single product
        $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->getJson("/api/v1/products/{$this->product->id}")
            ->assertStatus(200);

        // 3. Can view categories list
        $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->getJson('/api/v1/categories')
            ->assertStatus(200);

        // 4. CANNOT create product (403)
        $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson('/api/v1/products', [
                'name' => 'Forbidden Product',
                'sku' => 'FORBIDDEN-01',
                'price' => 10.00,
            ])
            ->assertStatus(403);

        // 5. CANNOT update product (403)
        $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->putJson("/api/v1/products/{$this->product->id}", [
                'name' => 'Hacked Name',
            ])
            ->assertStatus(403);

        // 6. CANNOT delete product (403)
        $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->deleteJson("/api/v1/products/{$this->product->id}")
            ->assertStatus(403);

        // 7. CANNOT create category (403)
        $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson('/api/v1/categories', ['name' => 'Forbidden Category'])
            ->assertStatus(403);

        // 8. CANNOT update category (403)
        $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->putJson("/api/v1/categories/{$this->category->id}", ['name' => 'Hacked Cat'])
            ->assertStatus(403);

        // 9. CANNOT delete category (403)
        $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->deleteJson("/api/v1/categories/{$this->category->id}")
            ->assertStatus(403);

        // 10. CANNOT upload image (403)
        $file = UploadedFile::fake()->image('test.jpg');
        $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson("/api/v1/products/{$this->product->id}/images", ['image' => $file])
            ->assertStatus(403);

        // 11. CANNOT create variant (403)
        $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson("/api/v1/products/{$this->product->id}/variants", [
                'name' => 'Forbidden Variant',
                'sku' => 'FORBIDDEN-VAR',
                'price' => 5.00,
            ])
            ->assertStatus(403);
    }

    /**
     * Test: Staff can create and update products and categories, but CANNOT delete them.
     */
    public function test_staff_role_permissions_boundary(): void
    {
        // 1. Staff can view products and categories
        $this->withHeader('Authorization', "Bearer {$this->staffToken}")
            ->getJson('/api/v1/products')
            ->assertStatus(200);

        $this->withHeader('Authorization', "Bearer {$this->staffToken}")
            ->getJson('/api/v1/categories')
            ->assertStatus(200);

        // 2. Staff can create product
        $createProdResp = $this->withHeader('Authorization', "Bearer {$this->staffToken}")
            ->postJson('/api/v1/products', [
                'name' => 'Staff Created Product',
                'sku' => 'STAFF-PROD-01',
                'price' => 30.00,
            ]);
        $createProdResp->assertStatus(201);
        $createdProdId = $createProdResp->json('product.id');

        // 3. Staff can update product
        $this->withHeader('Authorization', "Bearer {$this->staffToken}")
            ->putJson("/api/v1/products/{$createdProdId}", [
                'name' => 'Staff Updated Product',
            ])
            ->assertStatus(200);

        // 4. Staff CANNOT delete product (403)
        $this->withHeader('Authorization', "Bearer {$this->staffToken}")
            ->deleteJson("/api/v1/products/{$createdProdId}")
            ->assertStatus(403);
        $this->assertDatabaseHas('products', ['id' => $createdProdId, 'deleted_at' => null]);

        // 5. Staff can create category
        $createCatResp = $this->withHeader('Authorization', "Bearer {$this->staffToken}")
            ->postJson('/api/v1/categories', [
                'name' => 'Staff Created Category',
            ]);
        $createCatResp->assertStatus(201);
        $createdCatId = $createCatResp->json('category.id');

        // 6. Staff can update category
        $this->withHeader('Authorization', "Bearer {$this->staffToken}")
            ->putJson("/api/v1/categories/{$createdCatId}", [
                'name' => 'Staff Updated Category',
            ])
            ->assertStatus(200);

        // 7. Staff CANNOT delete category (403)
        $this->withHeader('Authorization', "Bearer {$this->staffToken}")
            ->deleteJson("/api/v1/categories/{$createdCatId}")
            ->assertStatus(403);
        $this->assertDatabaseHas('categories', ['id' => $createdCatId]);
    }

    /**
     * Test: Merchant has full catalog administrative permissions (including delete).
     */
    public function test_merchant_role_has_full_management_and_deletion_permissions(): void
    {
        $tempCat = Category::factory()->create(['tenant_id' => $this->tenant->id]);
        $tempProd = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'category_id' => null,
        ]);

        // Merchant can delete product
        $this->withHeader('Authorization', "Bearer {$this->merchantToken}")
            ->deleteJson("/api/v1/products/{$tempProd->id}")
            ->assertStatus(200);
        $this->assertSoftDeleted('products', ['id' => $tempProd->id]);

        // Merchant can delete empty category
        $this->withHeader('Authorization', "Bearer {$this->merchantToken}")
            ->deleteJson("/api/v1/categories/{$tempCat->id}")
            ->assertStatus(200);
        $this->assertDatabaseMissing('categories', ['id' => $tempCat->id]);
    }
}
