<?php

namespace Tests\Feature;

use App\Contracts\TenantContextInterface;
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

class ProductImageAndVariantTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $merchant;
    protected string $token;
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
        $this->product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    /**
     * Test: Upload image to product.
     */
    public function test_merchant_can_upload_image_to_product(): void
    {
        $file = UploadedFile::fake()->image('front.jpg', 600, 600);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/v1/products/{$this->product->id}/images", [
                'image' => $file,
                'alt_text' => 'Front view of product',
                'sort_order' => 1,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'image' => ['id', 'product_id', 'path', 'url', 'alt_text', 'sort_order'],
            ]);

        $path = $response->json('image.path');
        Storage::disk('public')->assertExists($path);
        $this->assertDatabaseHas('product_images', [
            'product_id' => $this->product->id,
            'path' => $path,
            'alt_text' => 'Front view of product',
        ]);
    }

    /**
     * Test: Delete image removes storage file and database record.
     */
    public function test_merchant_can_delete_product_image(): void
    {
        $file = UploadedFile::fake()->image('pic.jpg');
        $imagePath = $file->store("tenants/{$this->tenant->id}/products/{$this->product->id}", 'public');

        $image = ProductImage::factory()->create([
            'product_id' => $this->product->id,
            'path' => $imagePath,
        ]);

        Storage::disk('public')->assertExists($imagePath);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/products/{$this->product->id}/images/{$image->id}");

        $response->assertStatus(200);
        Storage::disk('public')->assertMissing($imagePath);
        $this->assertDatabaseMissing('product_images', ['id' => $image->id]);
    }

    /**
     * Test: Merchant can create product variant with tenant-scoped unique SKU.
     */
    public function test_merchant_can_create_product_variant(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/v1/products/{$this->product->id}/variants", [
                'name' => 'Size Large - Blue',
                'sku' => 'VAR-L-BLUE',
                'price' => 29.99,
                'stock_quantity' => 15,
                'options' => ['size' => 'L', 'color' => 'Blue'],
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'variant' => [
                    'name' => 'Size Large - Blue',
                    'sku' => 'VAR-L-BLUE',
                    'price' => 29.99,
                    'stock_quantity' => 15,
                ],
            ]);

        $this->assertDatabaseHas('product_variants', [
            'product_id' => $this->product->id,
            'sku' => 'VAR-L-BLUE',
        ]);
    }

    /**
     * Test: Variant with duplicate SKU in same tenant is rejected.
     */
    public function test_variant_duplicate_sku_in_same_tenant_is_rejected(): void
    {
        ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'VAR-EXISTING',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/v1/products/{$this->product->id}/variants", [
                'name' => 'Another Variant',
                'sku' => 'VAR-EXISTING',
                'price' => 35.00,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sku']);
    }

    /**
     * Test: Negative variant price and stock quantity are rejected.
     */
    public function test_negative_variant_price_and_stock_are_rejected(): void
    {
        $priceResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/v1/products/{$this->product->id}/variants", [
                'name' => 'Bad Price Variant',
                'sku' => 'VAR-BAD-PRICE',
                'price' => -5.00,
            ]);
        $priceResp->assertStatus(422)->assertJsonValidationErrors(['price']);

        $stockResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/v1/products/{$this->product->id}/variants", [
                'name' => 'Bad Stock Variant',
                'sku' => 'VAR-BAD-STOCK',
                'price' => 10.00,
                'stock_quantity' => -2,
            ]);
        $stockResp->assertStatus(422)->assertJsonValidationErrors(['stock_quantity']);
    }

    /**
     * Test: Merchant can update and delete product variant.
     */
    public function test_merchant_can_update_and_delete_variant(): void
    {
        $variant = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'price' => 10.00,
        ]);

        // Update
        $updateResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/v1/products/{$this->product->id}/variants/{$variant->id}", [
                'price' => 12.50,
            ]);
        $updateResp->assertStatus(200)
            ->assertJsonPath('variant.price', 12.50);

        // Delete
        $deleteResp = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/products/{$this->product->id}/variants/{$variant->id}");
        $deleteResp->assertStatus(200);
        $this->assertDatabaseMissing('product_variants', ['id' => $variant->id]);
    }
}
