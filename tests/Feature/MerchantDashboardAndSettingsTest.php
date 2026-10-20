<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class MerchantDashboardAndSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenantA;
    protected Tenant $tenantB;
    protected User $merchantA;
    protected User $merchantB;
    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        // Tenant A
        $this->tenantA = Tenant::factory()->create([
            'name' => 'متجر النخبة السعودي',
            'slug' => 'elite-store',
            'currency' => 'SAR',
            'status' => 'active',
            'settings' => ['low_stock_threshold' => 5],
        ]);

        $this->merchantA = User::factory()->create(['name' => 'التاجر فهد']);
        $this->merchantA->assignRole('Merchant');
        $this->tenantA->users()->attach($this->merchantA->id);

        // Tenant B
        $this->tenantB = Tenant::factory()->create([
            'name' => 'متجر الرياض التقني',
            'slug' => 'riyadh-tech',
            'currency' => 'SAR',
            'status' => 'active',
            'settings' => ['low_stock_threshold' => 10],
        ]);

        $this->merchantB = User::factory()->create(['name' => 'التاجر سلطان']);
        $this->merchantB->assignRole('Merchant');
        $this->tenantB->users()->attach($this->merchantB->id);

        // Normal Customer
        $this->customer = User::factory()->create(['name' => 'المتسوق خالد']);
        $this->customer->assignRole('Customer');
    }

    /**
     * Test merchant can fetch real-time dashboard metrics with actual sales, orders, and best sellers.
     */
    public function test_merchant_can_fetch_dashboard_metrics_with_real_sales_and_orders(): void
    {
        $category = Category::factory()->create(['tenant_id' => $this->tenantA->id]);

        // Products in Tenant A
        $p1 = Product::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'category_id' => $category->id,
            'name' => 'قهوة مختصة فاخرة',
            'price' => 100.00,
            'stock_quantity' => 20,
            'status' => 'active',
        ]);

        $p2 = Product::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'category_id' => $category->id,
            'name' => 'مبخرة عود ذكية',
            'price' => 250.00,
            'stock_quantity' => 3, // Low stock <= 5
            'status' => 'active',
        ]);

        // Orders in Tenant A
        // Completed Order with 2 units of p1
        $order1 = new Order([
            'order_number' => 'NOVA-100001',
            'customer_name' => 'سارة العتيبي',
            'customer_phone' => '0501112233',
            'shipping_city' => 'الرياض',
            'shipping_address' => 'حي الملقا',
            'payment_method' => 'mada',
            'payment_status' => 'paid',
            'status' => 'completed',
            'subtotal' => 200.00,
            'tax_amount' => 30.00,
            'shipping_fee' => 0.00,
            'discount_amount' => 0.00,
            'total' => 230.00,
            'currency' => 'SAR',
        ]);
        $order1->tenant_id = $this->tenantA->id;
        $order1->save();

        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $p1->id,
            'product_name' => $p1->name,
            'product_sku' => $p1->sku,
            'quantity' => 2,
            'unit_price' => 100.00,
            'line_total' => 200.00,
        ]);

        // Pending Order with 1 unit of p2
        $order2 = new Order([
            'order_number' => 'NOVA-100002',
            'customer_name' => 'محمد الدوسري',
            'customer_phone' => '0559998877',
            'shipping_city' => 'الدمام',
            'shipping_address' => 'حي الشاطئ',
            'payment_method' => 'cod',
            'payment_status' => 'pending',
            'status' => 'pending',
            'subtotal' => 250.00,
            'tax_amount' => 37.50,
            'shipping_fee' => 25.00,
            'discount_amount' => 0.00,
            'total' => 312.50,
            'currency' => 'SAR',
        ]);
        $order2->tenant_id = $this->tenantA->id;
        $order2->save();

        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => $p2->id,
            'product_name' => $p2->name,
            'product_sku' => $p2->sku,
            'quantity' => 1,
            'unit_price' => 250.00,
            'line_total' => 250.00,
        ]);

        // Authenticate as Merchant A
        $response = $this->actingAs($this->merchantA, 'sanctum')
            ->getJson('/api/v1/merchant/metrics', [
                'X-Tenant-Slug' => $this->tenantA->slug,
            ]);

        $response->assertStatus(Response::HTTP_OK)
            ->assertJsonPath('summary.total_orders', 2)
            ->assertJsonPath('summary.pending_orders', 1)
            ->assertJsonPath('summary.completed_orders', 1)
            ->assertJsonPath('summary.total_products', 2)
            ->assertJsonPath('summary.low_stock_products_count', 1);

        $this->assertEquals(230.00, $response->json('summary.total_revenue'));

        // Verify Best Sellers from actual line items
        $response->assertJsonCount(2, 'best_sellers');
        $this->assertEquals('قهوة مختصة فاخرة', $response->json('best_sellers.0.product_name'));
        $this->assertEquals(2, $response->json('best_sellers.0.units_sold'));

        // Verify recent orders
        $response->assertJsonCount(2, 'recent_orders');
    }

    /**
     * Test dashboard metrics are strictly scoped to the merchant's tenant.
     */
    public function test_dashboard_metrics_are_strictly_scoped_to_merchant_tenant(): void
    {
        // Tenant B has an order with 5,000 SAR
        $orderB = new Order([
            'order_number' => 'NOVA-999999',
            'customer_name' => 'عميل متجر ب',
            'customer_phone' => '0500000000',
            'shipping_city' => 'جدة',
            'shipping_address' => 'شارع التحلية',
            'payment_method' => 'mada',
            'payment_status' => 'paid',
            'status' => 'completed',
            'subtotal' => 5000.00,
            'tax_amount' => 750.00,
            'shipping_fee' => 0.00,
            'discount_amount' => 0.00,
            'total' => 5750.00,
            'currency' => 'SAR',
        ]);
        $orderB->tenant_id = $this->tenantB->id;
        $orderB->save();

        // Merchant A requests their own metrics
        $response = $this->actingAs($this->merchantA, 'sanctum')
            ->getJson('/api/v1/merchant/metrics', [
                'X-Tenant-Slug' => $this->tenantA->slug,
            ]);

        $response->assertStatus(Response::HTTP_OK)
            ->assertJsonPath('summary.total_orders', 0);
        $this->assertEquals(0, $response->json('summary.total_revenue'));
    }

    /**
     * Test merchant can list and filter inventory levels.
     */
    public function test_merchant_can_list_and_filter_inventory_levels(): void
    {
        $category = Category::factory()->create(['tenant_id' => $this->tenantA->id]);

        Product::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'category_id' => $category->id,
            'name' => 'منتج متوفر بكثرة',
            'sku' => 'STOCK-HIGH-01',
            'stock_quantity' => 50,
        ]);

        Product::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'category_id' => $category->id,
            'name' => 'منتج قارب على النفاد',
            'sku' => 'STOCK-LOW-01',
            'stock_quantity' => 2, // Low stock <= 5
        ]);

        Product::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'category_id' => $category->id,
            'name' => 'منتج نافد تماماً',
            'sku' => 'STOCK-OUT-01',
            'stock_quantity' => 0, // Out of stock
        ]);

        // Filter low_stock
        $lowStockRes = $this->actingAs($this->merchantA, 'sanctum')
            ->getJson('/api/v1/inventory?stock_status=low_stock', [
                'X-Tenant-Slug' => $this->tenantA->slug,
            ]);

        $lowStockRes->assertStatus(Response::HTTP_OK);
        $this->assertCount(1, $lowStockRes->json('data'));
        $this->assertEquals('STOCK-LOW-01', $lowStockRes->json('data.0.sku'));

        // Filter out_of_stock
        $outOfStockRes = $this->actingAs($this->merchantA, 'sanctum')
            ->getJson('/api/v1/inventory?stock_status=out_of_stock', [
                'X-Tenant-Slug' => $this->tenantA->slug,
            ]);

        $outOfStockRes->assertStatus(Response::HTTP_OK);
        $this->assertCount(1, $outOfStockRes->json('data'));
        $this->assertEquals('STOCK-OUT-01', $outOfStockRes->json('data.0.sku'));
    }

    /**
     * Test merchant can adjust inventory and negative quantities are rejected.
     */
    public function test_merchant_can_adjust_inventory_and_negative_quantities_are_rejected(): void
    {
        $category = Category::factory()->create(['tenant_id' => $this->tenantA->id]);

        $product = Product::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'category_id' => $category->id,
            'stock_quantity' => 10,
        ]);

        // 1. Add 15 units
        $addRes = $this->actingAs($this->merchantA, 'sanctum')
            ->postJson("/api/v1/inventory/{$product->id}/adjust", [
                'adjustment_type' => 'add',
                'quantity' => 15,
                'reason' => 'شحنة جديدة من المورد',
            ], ['X-Tenant-Slug' => $this->tenantA->slug]);

        $addRes->assertStatus(Response::HTTP_OK)
            ->assertJsonPath('product.stock_quantity', 25);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock_quantity' => 25,
        ]);

        // 2. Subtract 50 units (Current is 25, so this would be -25, which MUST fail)
        $subFailRes = $this->actingAs($this->merchantA, 'sanctum')
            ->postJson("/api/v1/inventory/{$product->id}/adjust", [
                'adjustment_type' => 'subtract',
                'quantity' => 50,
                'reason' => 'تعديل جرد خاطئ',
            ], ['X-Tenant-Slug' => $this->tenantA->slug]);

        $subFailRes->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);

        // Verify stock is still 25
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock_quantity' => 25,
        ]);
    }

    /**
     * Test merchant cannot adjust inventory of another tenant's product.
     */
    public function test_merchant_cannot_adjust_inventory_of_another_tenant_product(): void
    {
        $categoryB = Category::factory()->create(['tenant_id' => $this->tenantB->id]);
        $productB = Product::factory()->create([
            'tenant_id' => $this->tenantB->id,
            'category_id' => $categoryB->id,
            'stock_quantity' => 20,
        ]);

        // Merchant A attempts to adjust Product B
        $response = $this->actingAs($this->merchantA, 'sanctum')
            ->postJson("/api/v1/inventory/{$productB->id}/adjust", [
                'adjustment_type' => 'set',
                'quantity' => 0,
            ], ['X-Tenant-Slug' => $this->tenantA->slug]);

        $response->assertStatus(Response::HTTP_NOT_FOUND);
        $this->assertDatabaseHas('products', [
            'id' => $productB->id,
            'stock_quantity' => 20,
        ]);
    }

    /**
     * Test merchant can view scoped customer directory without exposing sensitive data.
     */
    public function test_merchant_can_view_scoped_customer_directory_without_sensitive_data(): void
    {
        $order = new Order([
            'order_number' => 'NOVA-777777',
            'customer_name' => 'فيصل الشمري',
            'customer_phone' => '0551234567',
            'customer_email' => 'faisal@example.com',
            'shipping_city' => 'حائل',
            'shipping_address' => 'حي النقرة',
            'payment_method' => 'mada',
            'payment_status' => 'paid',
            'status' => 'completed',
            'subtotal' => 450.00,
            'tax_amount' => 67.50,
            'shipping_fee' => 0.00,
            'discount_amount' => 0.00,
            'total' => 517.50,
            'currency' => 'SAR',
        ]);
        $order->tenant_id = $this->tenantA->id;
        $order->save();

        $response = $this->actingAs($this->merchantA, 'sanctum')
            ->getJson('/api/v1/customers', [
                'X-Tenant-Slug' => $this->tenantA->slug,
            ]);

        $response->assertStatus(Response::HTTP_OK)
            ->assertJsonPath('data.0.name', 'فيصل الشمري')
            ->assertJsonPath('data.0.phone', '0551234567')
            ->assertJsonPath('data.0.email', 'faisal@example.com')
            ->assertJsonPath('data.0.city', 'حائل')
            ->assertJsonPath('data.0.total_orders', 1)
            ->assertJsonPath('data.0.total_spent', 517.50);

        // Assert strictly that no passwords, tokens, or credential hashes are returned
        $customerData = $response->json('data.0');
        $this->assertArrayNotHasKey('password', $customerData);
        $this->assertArrayNotHasKey('remember_token', $customerData);
        $this->assertArrayNotHasKey('tokens', $customerData);
    }

    /**
     * Test merchant can view and update store settings.
     */
    public function test_merchant_can_view_and_update_store_settings(): void
    {
        // 1. Show Settings
        $showRes = $this->actingAs($this->merchantA, 'sanctum')
            ->getJson('/api/v1/merchant/settings', [
                'X-Tenant-Slug' => $this->tenantA->slug,
            ]);

        $showRes->assertStatus(Response::HTTP_OK)
            ->assertJsonPath('tenant.name', 'متجر النخبة السعودي');

        // 2. Update Settings
        $updateRes = $this->actingAs($this->merchantA, 'sanctum')
            ->patchJson('/api/v1/merchant/settings', [
                'name' => 'متجر النخبة المحدّث',
                'currency' => 'SAR',
                'description' => 'المتجر الرائد في المملكة العربية السعودية',
                'settings' => [
                    'contact_email' => 'support@elite-store.sa',
                    'contact_phone' => '920000000',
                    'contact_address' => 'الرياض - طريق الملك فهد',
                    'low_stock_threshold' => 8,
                    'shipping_policy' => 'شحن وتوصيل فوري خلال 24-48 ساعة لجميع مدن المملكة',
                    'return_policy' => 'استرجاع واستبدال مجاني خلال 14 يوماً من الاستلام',
                ],
            ], ['X-Tenant-Slug' => $this->tenantA->slug]);

        $updateRes->assertStatus(Response::HTTP_OK)
            ->assertJsonPath('tenant.name', 'متجر النخبة المحدّث')
            ->assertJsonPath('settings.low_stock_threshold', 8)
            ->assertJsonPath('settings.contact_email', 'support@elite-store.sa');

        $this->assertDatabaseHas('tenants', [
            'id' => $this->tenantA->id,
            'name' => 'متجر النخبة المحدّث',
        ]);
    }

    /**
     * Test unauthenticated or unauthorized users cannot access merchant dashboard APIs.
     */
    public function test_unauthenticated_or_unauthorized_user_is_denied_access_to_merchant_dashboard_apis(): void
    {
        // 1. Unauthenticated request to metrics
        $this->getJson('/api/v1/merchant/metrics', [
            'X-Tenant-Slug' => $this->tenantA->slug,
        ])->assertStatus(Response::HTTP_UNAUTHORIZED);

        // 2. Normal customer attempting to update store settings
        $this->actingAs($this->customer, 'sanctum')
            ->patchJson('/api/v1/merchant/settings', [
                'name' => 'محاولة اختراق',
            ], ['X-Tenant-Slug' => $this->tenantA->slug])
            ->assertStatus(Response::HTTP_FORBIDDEN);
    }
}
