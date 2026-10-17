<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderAndCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenantA;
    protected Tenant $tenantB;
    protected User $merchantA;
    protected User $merchantB;
    protected User $customerUser;
    protected Product $productA;
    protected Product $productB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        // Create Tenant A and Merchant A
        $this->tenantA = Tenant::create([
            'name' => 'Store Alpha',
            'slug' => 'store-alpha',
            'currency' => 'SAR',
            'status' => 'active',
        ]);

        $this->merchantA = User::create([
            'name' => 'Merchant Alpha',
            'email' => 'merchant.a@nova.test',
            'password' => bcrypt('password'),
        ]);
        $this->merchantA->assignRole('Merchant');
        $this->merchantA->tenants()->attach($this->tenantA->id);

        // Create Tenant B and Merchant B
        $this->tenantB = Tenant::create([
            'name' => 'Store Beta',
            'slug' => 'store-beta',
            'currency' => 'SAR',
            'status' => 'active',
        ]);

        $this->merchantB = User::create([
            'name' => 'Merchant Beta',
            'email' => 'merchant.b@nova.test',
            'password' => bcrypt('password'),
        ]);
        $this->merchantB->assignRole('Merchant');
        $this->merchantB->tenants()->attach($this->tenantB->id);

        // Create Customer User
        $this->customerUser = User::create([
            'name' => 'Customer Saud',
            'email' => 'customer.saud@nova.test',
            'password' => bcrypt('password'),
        ]);
        $this->customerUser->assignRole('Customer');

        // Create categories and products using factories
        $catA = Category::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Electronics A',
            'slug' => 'electronics-a',
            'is_active' => true,
        ]);

        $this->productA = Product::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'category_id' => $catA->id,
            'name' => 'Wireless Headphones',
            'slug' => 'wireless-headphones',
            'sku' => 'NOVA-ELEC-001',
            'price' => 749.00,
            'stock_quantity' => 20,
            'status' => 'active',
        ]);

        $catB = Category::factory()->create([
            'tenant_id' => $this->tenantB->id,
            'name' => 'Fashion B',
            'slug' => 'fashion-b',
            'is_active' => true,
        ]);

        $this->productB = Product::factory()->create([
            'tenant_id' => $this->tenantB->id,
            'category_id' => $catB->id,
            'name' => 'Designer Jacket',
            'slug' => 'designer-jacket',
            'sku' => 'NOVA-FASH-001',
            'price' => 450.00,
            'stock_quantity' => 15,
            'status' => 'active',
        ]);
    }

    public function test_customer_can_place_order_via_storefront_and_inventory_is_decremented(): void
    {
        $payload = [
            'customer_name' => 'فيصل بن عبدالعزيز',
            'customer_phone' => '0501234567',
            'customer_email' => 'faisal@example.com',
            'shipping_city' => 'الرياض',
            'shipping_address' => 'حي النرجس، شارع أنس بن مالك',
            'shipping_notes' => 'الاتصال قبل الوصول',
            'payment_method' => 'mada',
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity' => 2,
                ],
            ],
        ];

        $response = $this->postJson("/api/v1/storefront/{$this->tenantA->slug}/checkout", $payload);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Order placed successfully.')
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'order_number',
                    'status',
                    'customer' => ['name', 'phone', 'email'],
                    'shipping' => ['city', 'address'],
                    'financials' => ['subtotal', 'shipping_fee', 'total', 'currency'],
                    'items',
                ],
            ]);

        // Verify stock decremented: 20 - 2 = 18
        $this->productA->refresh();
        $this->assertEquals(18, $this->productA->stock_quantity);

        // Verify order created in database
        $this->assertDatabaseHas('orders', [
            'tenant_id' => $this->tenantA->id,
            'customer_name' => 'فيصل بن عبدالعزيز',
            'shipping_city' => 'الرياض',
            'subtotal' => 1498.00, // 749 * 2
            'shipping_fee' => 0.00, // Free shipping for >= 200 SAR
            'total' => 1498.00,
            'currency' => 'SAR',
        ]);

        $this->assertDatabaseHas('order_items', [
            'product_id' => $this->productA->id,
            'product_name' => 'Wireless Headphones',
            'product_sku' => 'NOVA-ELEC-001',
            'unit_price' => 749.00,
            'quantity' => 2,
            'line_total' => 1498.00,
        ]);
    }

    public function test_checkout_with_insufficient_stock_fails_and_does_not_mutate_inventory(): void
    {
        $payload = [
            'customer_name' => 'طارق الزهراني',
            'customer_phone' => '0559876543',
            'shipping_city' => 'جدة',
            'shipping_address' => 'حي الشاطئ',
            'payment_method' => 'apple_pay',
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity' => 999, // Exceeds available stock of 20
                ],
            ],
        ];

        $response = $this->postJson("/api/v1/storefront/{$this->tenantA->slug}/checkout", $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);

        // Verify stock was not touched
        $this->productA->refresh();
        $this->assertEquals(20, $this->productA->stock_quantity);

        // Verify no order created
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
    }

    public function test_server_enforces_pricing_authority_ignoring_client_tampering(): void
    {
        $payload = [
            'customer_name' => 'متسوق',
            'customer_phone' => '0541112233',
            'shipping_city' => 'الدمام',
            'shipping_address' => 'حي المزروعية',
            'payment_method' => 'cod',
            'subtotal' => 10.00, // Client tries to forge subtotal
            'total' => 10.00,    // Client tries to forge total
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'unit_price' => 5.00, // Client tries to forge unit price
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->postJson("/api/v1/storefront/{$this->tenantA->slug}/checkout", $payload);

        $response->assertStatus(201);

        // Subtotal must be calculated from database: 749.00
        $this->assertDatabaseHas('orders', [
            'subtotal' => 749.00,
            'total' => 749.00,
        ]);

        $this->assertDatabaseHas('order_items', [
            'unit_price' => 749.00,
            'line_total' => 749.00,
        ]);
    }

    public function test_customer_cannot_order_products_from_another_tenant(): void
    {
        // Try checking out on Tenant A's store with Tenant B's product
        $payload = [
            'customer_name' => 'متسلل عبر المتاجر',
            'customer_phone' => '0500000000',
            'shipping_city' => 'الرياض',
            'shipping_address' => 'العنوان',
            'payment_method' => 'mada',
            'items' => [
                [
                    'product_id' => $this->productB->id, // Belongs to Store Beta, not Store Alpha
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->postJson("/api/v1/storefront/{$this->tenantA->slug}/checkout", $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_standalone_mode_resolves_local_tenant_for_checkout(): void
    {
        config(['nova.deployment_mode' => 'standalone']);

        $payload = [
            'customer_name' => 'عميل النسخة المستقلة',
            'customer_phone' => '0551234567',
            'shipping_city' => 'الرياض',
            'shipping_address' => 'حي الملز',
            'payment_method' => 'mada',
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity' => 1,
                ],
            ],
        ];

        // Slug is unknown, but standalone mode resolves the single local store
        $response = $this->postJson('/api/v1/storefront/standalone-local-store/checkout', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('orders', [
            'customer_name' => 'عميل النسخة المستقلة',
        ]);
    }

    public function test_merchant_can_view_orders_for_their_tenant_only(): void
    {
        // Create an order in Tenant A
        $orderA = Order::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'order_number' => 'NOVA-AAA111',
            'status' => 'pending',
            'customer_name' => 'زبون متجر أ',
            'customer_phone' => '0501111111',
            'shipping_city' => 'الرياض',
            'shipping_address' => 'عنوان أ',
            'payment_method' => 'mada',
            'payment_status' => 'paid',
            'subtotal' => 749.00,
            'total' => 749.00,
            'currency' => 'SAR',
        ]);

        // Create an order in Tenant B
        $orderB = Order::factory()->create([
            'tenant_id' => $this->tenantB->id,
            'order_number' => 'NOVA-BBB222',
            'status' => 'pending',
            'customer_name' => 'زبون متجر ب',
            'customer_phone' => '0502222222',
            'shipping_city' => 'جدة',
            'shipping_address' => 'عنوان ب',
            'payment_method' => 'mada',
            'payment_status' => 'paid',
            'subtotal' => 450.00,
            'total' => 450.00,
            'currency' => 'SAR',
        ]);

        // Merchant A listing orders
        $tokenA = $this->merchantA->createToken('test')->plainTextToken;
        $responseA = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->withHeader('X-Tenant-ID', (string) $this->tenantA->id)
            ->getJson('/api/v1/orders');

        $responseA->assertStatus(200);
        $ordersListA = $responseA->json('data');
        $this->assertCount(1, $ordersListA);
        $this->assertEquals('NOVA-AAA111', $ordersListA[0]['order_number']);

        // Merchant A attempting to view Tenant B's order
        $responseShowB = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->withHeader('X-Tenant-ID', (string) $this->tenantA->id)
            ->getJson("/api/v1/orders/{$orderB->id}");

        $responseShowB->assertStatus(404);
    }

    public function test_merchant_can_update_order_status_and_cancellation_restores_stock(): void
    {
        // Place an order: stock was 20, now 18
        $order = Order::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'order_number' => 'NOVA-TEST-CANCEL',
            'status' => 'processing',
            'customer_name' => 'عميل تجريبي',
            'customer_phone' => '0501234567',
            'shipping_city' => 'الرياض',
            'shipping_address' => 'شارع الملك فهد',
            'payment_method' => 'mada',
            'payment_status' => 'paid',
            'subtotal' => 1498.00,
            'total' => 1498.00,
            'currency' => 'SAR',
        ]);

        $order->items()->create([
            'product_id' => $this->productA->id,
            'product_name' => $this->productA->name,
            'product_sku' => $this->productA->sku,
            'unit_price' => $this->productA->price,
            'quantity' => 2,
            'line_total' => 1498.00,
        ]);

        $this->productA->update(['stock_quantity' => 18]);

        // Merchant A cancels the order
        $tokenA = $this->merchantA->createToken('test')->plainTextToken;
        $response = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->withHeader('X-Tenant-ID', (string) $this->tenantA->id)
            ->patchJson("/api/v1/orders/{$order->id}/status", [
                'status' => 'cancelled',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');

        // Stock must be restored: 18 + 2 = 20
        $this->productA->refresh();
        $this->assertEquals(20, $this->productA->stock_quantity);
    }

    public function test_authenticated_customer_sees_only_their_own_orders(): void
    {
        // Order belonging to Customer Saud
        $orderSaud = Order::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'user_id' => $this->customerUser->id,
            'order_number' => 'NOVA-SAUD-01',
            'status' => 'pending',
            'customer_name' => 'Customer Saud',
            'customer_phone' => '0501111111',
            'shipping_city' => 'الرياض',
            'shipping_address' => 'شارع التخصصي',
            'payment_method' => 'mada',
            'subtotal' => 749.00,
            'total' => 749.00,
            'currency' => 'SAR',
        ]);

        // Order belonging to another user
        $otherUser = User::create([
            'name' => 'Other User',
            'email' => 'other@nova.test',
            'password' => bcrypt('password'),
        ]);

        $orderOther = Order::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'user_id' => $otherUser->id,
            'order_number' => 'NOVA-OTHER-02',
            'status' => 'pending',
            'customer_name' => 'Other User',
            'customer_phone' => '0502222222',
            'shipping_city' => 'الخبر',
            'shipping_address' => 'شارع الظهران',
            'payment_method' => 'mada',
            'subtotal' => 749.00,
            'total' => 749.00,
            'currency' => 'SAR',
        ]);

        $tokenCustomer = $this->customerUser->createToken('test')->plainTextToken;

        // Customer lists their orders
        $response = $this->withHeader('Authorization', "Bearer {$tokenCustomer}")
            ->getJson('/api/v1/account/orders');

        $response->assertStatus(200);
        $ordersList = $response->json('data');
        $this->assertCount(1, $ordersList);
        $this->assertEquals('NOVA-SAUD-01', $ordersList[0]['order_number']);

        // Customer attempts to view other user's order
        $responseOther = $this->withHeader('Authorization', "Bearer {$tokenCustomer}")
            ->getJson("/api/v1/account/orders/{$orderOther->id}");

        $responseOther->assertStatus(404);
    }
}
