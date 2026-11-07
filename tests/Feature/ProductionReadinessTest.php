<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class ProductionReadinessTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $merchant;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->tenant = Tenant::create([
            'name' => 'متجر نوفا الرئيسي',
            'slug' => 'nova-flagship',
            'currency' => 'SAR',
            'status' => 'active',
        ]);

        $this->merchant = User::create([
            'name' => 'مدير المتجر',
            'email' => 'admin@nova-flagship.test',
            'password' => bcrypt('password'),
        ]);
        $this->merchant->assignRole('Merchant');
        $this->merchant->tenants()->attach($this->tenant->id);

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'إلكترونيات',
            'slug' => 'electronics',
            'is_active' => true,
        ]);

        $this->product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'category_id' => $category->id,
            'name' => 'هاتف ذكي فائق',
            'slug' => 'smartphone-ultra',
            'sku' => 'PHN-001',
            'price' => 3200.00,
            'stock_quantity' => 10,
            'status' => 'active',
        ]);
    }

    /**
     * Test 1: Production security headers are attached to HTTP responses.
     */
    public function test_security_headers_are_attached_to_responses(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-XSS-Protection', '1; mode=block');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }

    /**
     * Test 2: Standard Laravel health endpoint returns HTTP 200.
     */
    public function test_health_check_endpoint_is_operational(): void
    {
        $response = $this->get('/up');
        $response->assertStatus(200);
    }

    /**
     * Test 3: nova:health command executes and reports system integrity.
     */
    public function test_nova_health_artisan_command_passes(): void
    {
        $exitCode = Artisan::call('nova:health');
        $output = Artisan::output();

        $this->assertEquals(0, $exitCode);
        $this->assertStringContainsString('NOVA Commerce Platform — Production Health Check', $output);
        $this->assertStringContainsString('All core production health checks passed successfully', $output);
    }

    /**
     * Test 4: nova:backup command generates database snapshot in safe storage.
     */
    public function test_nova_backup_command_generates_snapshot(): void
    {
        $backupDir = storage_path('app/backups');
        if (File::isDirectory($backupDir)) {
            File::cleanDirectory($backupDir);
        }

        $exitCode = Artisan::call('nova:backup');
        $output = Artisan::output();

        $this->assertEquals(0, $exitCode);
        $this->assertStringContainsString('Backup successfully generated', $output);

        $this->assertTrue(File::isDirectory($backupDir));

        $backupFiles = File::files($backupDir);
        $this->assertNotEmpty($backupFiles);

        $latestBackup = end($backupFiles);
        $content = json_decode(File::get($latestBackup->getPathname()), true);

        $this->assertIsArray($content);
        $this->assertArrayHasKey('metadata', $content);
        $this->assertArrayHasKey('tables', $content);
        $this->assertArrayHasKey('tenants', $content['tables']);
        $this->assertArrayHasKey('products', $content['tables']);
    }

    /**
     * Test 5: Safe exception handling in API when requesting non-existent API routes.
     */
    public function test_api_renders_safe_error_when_debug_is_false(): void
    {
        Config::set('app.debug', false);

        // Attempting to request non-existent endpoint
        $response = $this->getJson('/api/v1/non-existent-endpoint');

        $response->assertStatus(404);
        $response->assertJsonStructure(['message']);
        // Verify no stack trace or SQL information is leaked
        $json = $response->getContent();
        $this->assertStringNotContainsString('trace', $json);
        $this->assertStringNotContainsString('SQLSTATE', $json);
    }

    /**
     * Test 6: Terminal status for cancelled orders prevents re-activation.
     */
    public function test_cancelled_order_is_terminal_and_cannot_be_reopened(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_number' => 'ORD-TERMINAL-01',
            'status' => 'cancelled',
            'customer_name' => 'عميل ملغي',
            'customer_phone' => '0555555555',
            'shipping_city' => 'الرياض',
            'shipping_address' => 'شارع التحلية',
            'payment_method' => 'cod',
            'subtotal' => 3200.00,
            'total' => 3200.00,
            'currency' => 'SAR',
        ]);

        $token = $this->merchant->createToken('test')->plainTextToken;

        // Attempt to move order from cancelled back to processing
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Tenant-ID', (string) $this->tenant->id)
            ->patchJson("/api/v1/orders/{$order->id}/status", [
                'status' => 'processing',
            ]);

        // Must reject transition with 422 Unprocessable Content
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);

        // Order remains cancelled in database
        $this->assertEquals('cancelled', $order->fresh()->status);
    }

    /**
     * Test 7: Standalone deployment mode falls back to active store if slug missing.
     */
    public function test_standalone_deployment_mode_resolves_local_store(): void
    {
        Config::set('nova.deployment_mode', 'standalone');

        // Requesting with arbitrary slug in standalone mode
        $response = $this->getJson('/api/v1/storefront/arbitrary-slug');

        $response->assertStatus(200)
            ->assertJsonPath('tenant.slug', 'nova-flagship');
    }

    /**
     * Test 8: Hosted multi-tenant mode strictly rejects non-existent tenant slugs with 404.
     */
    public function test_hosted_multi_tenant_mode_strictly_rejects_missing_slugs(): void
    {
        Config::set('nova.deployment_mode', 'hosted');

        $response = $this->getJson('/api/v1/storefront/non-existent-tenant-slug');

        $response->assertStatus(404);
    }
}
