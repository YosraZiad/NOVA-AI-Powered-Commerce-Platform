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

class CatalogValidationSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $merchant;
    protected string $token;
    protected Category $category;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        Storage::fake('public');

        $this->tenant = Tenant::factory()->create(['status' => 'active']);
        $this->merchant = User::factory()->create();
        $this->merchant->assignRole('Merchant');
        $this->merchant->tenants()->attach($this->tenant->id);
        $this->token = $this->merchant->createToken('auth-token')->plainTextToken;

        app(TenantContextInterface::class)->setTenant($this->tenant);
        $this->category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
        ]);
    }

    /**
     * Test: Invalid product status values are rejected.
     */
    public function test_invalid_product_status_is_rejected(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/products', [
                'name' => 'Bad Status Product',
                'sku' => 'BAD-STAT-01',
                'price' => 20.00,
                'status' => 'banned_or_invalid',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /**
     * Test: Non-existent category ID is rejected.
     */
    public function test_non_existent_category_id_is_rejected(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/products', [
                'name' => 'Invalid Category Product',
                'sku' => 'BAD-CAT-01',
                'price' => 20.00,
                'category_id' => 999999,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);
    }

    /**
     * Test: Invalid image file types and oversized files are rejected.
     */
    public function test_invalid_image_files_and_oversized_files_are_rejected(): void
    {
        // 1. Non-image file (plain text disguised or .txt)
        $txtFile = UploadedFile::fake()->create('document.txt', 100, 'text/plain');
        $textResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/v1/products/{$this->product->id}/images", [
                'image' => $txtFile,
            ]);
        $textResp->assertStatus(422)
            ->assertJsonValidationErrors(['image']);

        // 2. Oversized image (> 5120 KB = 5MB)
        $oversizedFile = UploadedFile::fake()->create('huge.jpg', 6000, 'image/jpeg');
        $oversizedResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/v1/products/{$this->product->id}/images", [
                'image' => $oversizedFile,
            ]);
        $oversizedResp->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    }

    /**
     * Test: Non-allowlisted sorting column is rejected.
     */
    public function test_non_allowlisted_sort_column_is_rejected(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/products?sort_by=password');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sort_by']);
    }

    /**
     * Test: Non-allowlisted sort direction is rejected.
     */
    public function test_non_allowlisted_sort_direction_is_rejected(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/products?sort_direction=sideways');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sort_direction']);
    }

    /**
     * Test: Pagination bounds are enforced by validation.
     */
    public function test_pagination_bounds_are_enforced(): void
    {
        // per_page below 1
        $lowResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/products?per_page=0');
        $lowResp->assertStatus(422)
            ->assertJsonValidationErrors(['per_page']);

        // per_page above 100
        $highResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/products?per_page=150');
        $highResp->assertStatus(422)
            ->assertJsonValidationErrors(['per_page']);
    }

    /**
     * Test: Variant operations strictly verify product ownership.
     */
    public function test_variant_operations_verify_product_ownership(): void
    {
        $product2 = Product::factory()->create(['tenant_id' => $this->tenant->id]);
        $variantOnProduct1 = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'P1-VAR-01',
        ]);

        // Attempting to access variantOnProduct1 via product2 URL should 404
        $showResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/v1/products/{$product2->id}/variants/{$variantOnProduct1->id}");
        $showResp->assertStatus(404);

        // Attempting to update variantOnProduct1 via product2 URL should 404
        $updResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/v1/products/{$product2->id}/variants/{$variantOnProduct1->id}", [
                'name' => 'Tampered Name',
            ]);
        $updResp->assertStatus(404);

        // Attempting to delete variantOnProduct1 via product2 URL should 404
        $delResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/products/{$product2->id}/variants/{$variantOnProduct1->id}");
        $delResp->assertStatus(404);

        $this->assertDatabaseHas('product_variants', ['id' => $variantOnProduct1->id]);
    }
}
