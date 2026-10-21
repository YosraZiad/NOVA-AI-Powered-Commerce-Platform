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
    protected User $staffA;
    protected User $customerA;

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

        $this->staffA = User::factory()->create(['name' => 'الموظف طارق']);
        $this->staffA->assignRole('Staff');
        $this->tenantA->users()->attach($this->staffA->id);

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

        // Customer associated with Tenant A
        $this->customerA = User::factory()->create(['name' => 'المتسوق خالد']);
        $this->customerA->assignRole('Customer');
        $this->tenantA->users()->attach($this->customerA->id);
    }

    /**
     * Test merchant can fetch real-time dashboard metrics with actual sales, orders, and best sellers.
     */
    public function test_merchant_can_fetch_dashboard_metrics_with_real_sales_and_orders(): void
    {
        $category = Category::factory()->create(['tenant_id' => $this->tenantA->id]);

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

        // Verify sales trend structure
        $response->assertJsonCount(7, 'sales_trend');
        $this->assertNotNull($response->json('sales_trend.0.label'));
        $this->assertNotNull($response->json('sales_trend.0.day_name'));
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

        // Verify stock remains untouched at 25
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock_quantity' => 25,
        ]);

        // 3. Set stock directly to 8
        $setRes = $this->actingAs($this->merchantA, 'sanctum')
            ->postJson("/api/v1/inventory/{$product->id}/adjust", [
                'adjustment_type' => 'set',
                'quantity' => 8,
                'reason' => 'جرد فصلي معتمد',
            ], ['X-Tenant-Slug' => $this->tenantA->slug]);

        $setRes->assertStatus(Response::HTTP_OK)
            ->assertJsonPath('product.stock_quantity', 8);
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
            ->assertJsonPath('data.0.total_orders', 1);

        $this->assertEquals(517.50, $response->json('data.0.total_spent'));

        // Assert strictly that no passwords, tokens, or credential hashes are returned
        $customerData = $response->json('data.0');
        $this->assertArrayNotHasKey('password', $customerData);
        $this->assertArrayNotHasKey('remember_token', $customerData);
        $this->assertArrayNotHasKey('tokens', $customerData);
    }

    /**
     * Test cancelled orders do not inflate customer total spent.
     */
    public function test_cancelled_orders_do_not_inflate_customer_total_spent(): void
    {
        // Completed Order for 300 SAR
        $orderGood = new Order([
            'order_number' => 'NOVA-888881',
            'customer_name' => 'ناصر الدوسري',
            'customer_phone' => '0505554433',
            'customer_email' => 'nasser@example.com',
            'shipping_city' => 'الخرج',
            'shipping_address' => 'حي السلام',
            'payment_method' => 'mada',
            'payment_status' => 'paid',
            'status' => 'completed',
            'subtotal' => 300.00,
            'tax_amount' => 45.00,
            'shipping_fee' => 0.00,
            'discount_amount' => 0.00,
            'total' => 345.00,
            'currency' => 'SAR',
        ]);
        $orderGood->tenant_id = $this->tenantA->id;
        $orderGood->save();

        // Cancelled Order for 1,000 SAR for the same customer
        $orderBad = new Order([
            'order_number' => 'NOVA-888882',
            'customer_name' => 'ناصر الدوسري',
            'customer_phone' => '0505554433',
            'customer_email' => 'nasser@example.com',
            'shipping_city' => 'الخرج',
            'shipping_address' => 'حي السلام',
            'payment_method' => 'mada',
            'payment_status' => 'refunded',
            'status' => 'cancelled',
            'subtotal' => 1000.00,
            'tax_amount' => 150.00,
            'shipping_fee' => 0.00,
            'discount_amount' => 0.00,
            'total' => 1150.00,
            'currency' => 'SAR',
        ]);
        $orderBad->tenant_id = $this->tenantA->id;
        $orderBad->save();

        $response = $this->actingAs($this->merchantA, 'sanctum')
            ->getJson('/api/v1/customers?search=0505554433', [
                'X-Tenant-Slug' => $this->tenantA->slug,
            ]);

        $response->assertStatus(Response::HTTP_OK);
        // Total orders is 2, but total_spent MUST only be 345 (excluding the 1150 cancelled order)
        $this->assertEquals(2, $response->json('data.0.total_orders'));
        $this->assertEquals(345.00, $response->json('data.0.total_spent'));
    }

    /**
     * Test merchant can view and update store settings including logo/logo_url.
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

        // 2. Update Settings with logo_url
        $updateRes = $this->actingAs($this->merchantA, 'sanctum')
            ->patchJson('/api/v1/merchant/settings', [
                'name' => 'متجر النخبة المحدّث',
                'currency' => 'SAR',
                'logo_url' => 'https://example.com/logo-elite.png',
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
            ->assertJsonPath('tenant.logo', 'https://example.com/logo-elite.png')
            ->assertJsonPath('settings.low_stock_threshold', 8)
            ->assertJsonPath('settings.contact_email', 'support@elite-store.sa');

        $this->assertDatabaseHas('tenants', [
            'id' => $this->tenantA->id,
            'name' => 'متجر النخبة المحدّث',
            'logo' => 'https://example.com/logo-elite.png',
        ]);
    }

    /**
     * Test store settings update rejects invalid currency.
     */
    public function test_store_settings_update_rejects_invalid_currency(): void
    {
        $response = $this->actingAs($this->merchantA, 'sanctum')
            ->patchJson('/api/v1/merchant/settings', [
                'currency' => 'INVALID_CURRENCY_XYZ',
            ], ['X-Tenant-Slug' => $this->tenantA->slug]);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY)
            ->assertJsonValidationErrors(['currency']);
    }

    /**
     * Test unauthenticated access to all merchant APIs is rejected with 401.
     */
    public function test_unauthenticated_requests_are_denied_for_all_merchant_apis(): void
    {
        $headers = ['X-Tenant-Slug' => $this->tenantA->slug];

        $this->getJson('/api/v1/merchant/metrics', $headers)->assertStatus(Response::HTTP_UNAUTHORIZED);
        $this->getJson('/api/v1/inventory', $headers)->assertStatus(Response::HTTP_UNAUTHORIZED);
        $this->postJson('/api/v1/inventory/1/adjust', [], $headers)->assertStatus(Response::HTTP_UNAUTHORIZED);
        $this->getJson('/api/v1/customers', $headers)->assertStatus(Response::HTTP_UNAUTHORIZED);
        $this->getJson('/api/v1/merchant/settings', $headers)->assertStatus(Response::HTTP_UNAUTHORIZED);
        $this->patchJson('/api/v1/merchant/settings', [], $headers)->assertStatus(Response::HTTP_UNAUTHORIZED);
    }

    /**
     * Test authenticated customer attached to tenant is strictly forbidden from all merchant APIs.
     */
    public function test_authenticated_customer_attached_to_tenant_is_forbidden_from_all_merchant_apis(): void
    {
        $headers = ['X-Tenant-Slug' => $this->tenantA->slug];

        $category = Category::factory()->create(['tenant_id' => $this->tenantA->id]);
        $product = Product::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'category_id' => $category->id,
            'stock_quantity' => 10,
        ]);

        // 1. Customer cannot access metrics
        $this->actingAs($this->customerA, 'sanctum')
            ->getJson('/api/v1/merchant/metrics', $headers)
            ->assertStatus(Response::HTTP_FORBIDDEN);

        // 2. Customer cannot access inventory list
        $this->actingAs($this->customerA, 'sanctum')
            ->getJson('/api/v1/inventory', $headers)
            ->assertStatus(Response::HTTP_FORBIDDEN);

        // 3. Customer cannot adjust inventory
        $this->actingAs($this->customerA, 'sanctum')
            ->postJson("/api/v1/inventory/{$product->id}/adjust", [
                'adjustment_type' => 'set',
                'quantity' => 100,
            ], $headers)
            ->assertStatus(Response::HTTP_FORBIDDEN);

        // 4. Customer cannot view customer directory
        $this->actingAs($this->customerA, 'sanctum')
            ->getJson('/api/v1/customers', $headers)
            ->assertStatus(Response::HTTP_FORBIDDEN);

        // 5. Customer cannot view store settings
        $this->actingAs($this->customerA, 'sanctum')
            ->getJson('/api/v1/merchant/settings', $headers)
            ->assertStatus(Response::HTTP_FORBIDDEN);

        // 6. Customer cannot update store settings
        $this->actingAs($this->customerA, 'sanctum')
            ->patchJson('/api/v1/merchant/settings', [
                'name' => 'محاولة اختراق العميل',
            ], $headers)
            ->assertStatus(Response::HTTP_FORBIDDEN);
    }

    /**
     * Test staff role can view metrics and inventory, but is forbidden from updating store settings.
     */
    public function test_staff_can_view_metrics_and_inventory_but_cannot_update_store_settings(): void
    {
        $headers = ['X-Tenant-Slug' => $this->tenantA->slug];

        // Staff CAN view metrics
        $this->actingAs($this->staffA, 'sanctum')
            ->getJson('/api/v1/merchant/metrics', $headers)
            ->assertStatus(Response::HTTP_OK);

        // Staff CAN view inventory
        $this->actingAs($this->staffA, 'sanctum')
            ->getJson('/api/v1/inventory', $headers)
            ->assertStatus(Response::HTTP_OK);

        // Staff CAN view customers
        $this->actingAs($this->staffA, 'sanctum')
            ->getJson('/api/v1/customers', $headers)
            ->assertStatus(Response::HTTP_OK);

        // Staff CANNOT update store settings (only Merchant or Platform Admin can)
        $this->actingAs($this->staffA, 'sanctum')
            ->patchJson('/api/v1/merchant/settings', [
                'name' => 'اسم غير مسموح للموظف',
            ], $headers)
            ->assertStatus(Response::HTTP_FORBIDDEN);
    }

    /**
     * Test end-to-end integration: order placement -> inventory deduction -> metrics update -> isolation.
     */
    public function test_end_to_end_order_lifecycle_updates_dashboard_and_inventory(): void
    {
        $category = Category::factory()->create(['tenant_id' => $this->tenantA->id]);

        $product = Product::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'category_id' => $category->id,
            'name' => 'سماعات بلوتوث ذكية',
            'price' => 150.00,
            'stock_quantity' => 20,
            'status' => 'active',
        ]);

        // 1. Checkout order placed via storefront API
        $checkoutResponse = $this->postJson("/api/v1/storefront/{$this->tenantA->slug}/checkout", [
            'customer_name' => 'عبدالله السبيعي',
            'customer_phone' => '0541112233',
            'customer_email' => 'abdullah@example.com',
            'shipping_city' => 'جدة',
            'shipping_address' => 'حي الروضة',
            'payment_method' => 'mada',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 4,
                ],
            ],
        ]);

        $checkoutResponse->assertStatus(Response::HTTP_CREATED);
        $orderNumber = $checkoutResponse->json('order.order_number');

        // 2. Verify product inventory was decremented automatically from 20 to 16
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock_quantity' => 16,
        ]);

        // 3. Merchant verifies dashboard overview
        $metricsRes = $this->actingAs($this->merchantA, 'sanctum')
            ->getJson('/api/v1/merchant/metrics', [
                'X-Tenant-Slug' => $this->tenantA->slug,
            ]);

        $metricsRes->assertStatus(Response::HTTP_OK)
            ->assertJsonPath('summary.total_orders', 1)
            ->assertJsonPath('summary.total_inventory_units', 16);

        // 4. Merchant verifies inventory management API
        $invRes = $this->actingAs($this->merchantA, 'sanctum')
            ->getJson('/api/v1/inventory?search=سماعات', [
                'X-Tenant-Slug' => $this->tenantA->slug,
            ]);

        $invRes->assertStatus(Response::HTTP_OK)
            ->assertJsonPath('data.0.stock_quantity', 16);

        // 5. Merchant verifies customer directory
        $custRes = $this->actingAs($this->merchantA, 'sanctum')
            ->getJson('/api/v1/customers?search=عبدالله', [
                'X-Tenant-Slug' => $this->tenantA->slug,
            ]);

        $custRes->assertStatus(Response::HTTP_OK)
            ->assertJsonPath('data.0.name', 'عبدالله السبيعي')
            ->assertJsonPath('data.0.phone', '0541112233');

        // 6. Strict Isolation: Merchant B cannot see Tenant A's customer or order
        $merchantBMetrics = $this->actingAs($this->merchantB, 'sanctum')
            ->getJson('/api/v1/merchant/metrics', [
                'X-Tenant-Slug' => $this->tenantB->slug,
            ]);

        $merchantBMetrics->assertStatus(Response::HTTP_OK)
            ->assertJsonPath('summary.total_orders', 0);

        $merchantBCust = $this->actingAs($this->merchantB, 'sanctum')
            ->getJson('/api/v1/customers?search=عبدالله', [
                'X-Tenant-Slug' => $this->tenantB->slug,
            ]);

        $merchantBCust->assertStatus(Response::HTTP_OK);
        $this->assertCount(0, $merchantBCust->json('data'));
    }
}
