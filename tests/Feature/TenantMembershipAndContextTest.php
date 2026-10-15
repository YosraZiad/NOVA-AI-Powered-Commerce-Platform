<?php

namespace Tests\Feature;

use App\Contracts\TenantContextInterface;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TenantMembershipAndContextTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /**
     * Test: Roles and permissions exist and are configured as required.
     */
    public function test_roles_and_permissions_are_configured_properly(): void
    {
        $expectedRoles = ['Customer', 'Merchant', 'Staff', 'Platform Admin'];
        foreach ($expectedRoles as $roleName) {
            $this->assertTrue(Role::where('name', $roleName)->exists(), "Role [{$roleName}] does not exist.");
        }

        $expectedPermissions = [
            'products.view',
            'products.create',
            'products.update',
            'products.delete',
            'orders.view',
            'orders.update',
            'inventory.view',
            'inventory.update',
            'analytics.view',
            'ai.use',
            'ai.manage',
        ];

        foreach ($expectedPermissions as $permName) {
            $this->assertTrue(Permission::where('name', $permName)->exists(), "Permission [{$permName}] does not exist.");
        }

        $merchant = Role::findByName('Merchant');
        $this->assertTrue($merchant->hasPermissionTo('products.create'));
        $this->assertTrue($merchant->hasPermissionTo('ai.manage'));

        $customer = Role::findByName('Customer');
        $this->assertTrue($customer->hasPermissionTo('products.view'));
        $this->assertFalse($customer->hasPermissionTo('products.create'));
    }

    /**
     * Test 7: Merchant belongs to the correct tenant.
     */
    public function test_merchant_belongs_to_the_correct_tenant(): void
    {
        $tenant = Tenant::factory()->create(['name' => 'Merchant Store']);
        $merchant = User::factory()->create(['name' => 'Store Merchant']);
        $merchant->assignRole('Merchant');
        $merchant->tenants()->attach($tenant->id);

        $this->assertTrue($merchant->tenants->contains($tenant));
        $this->assertEquals(1, $merchant->tenants()->count());
        $this->assertEquals('Merchant Store', $merchant->tenants()->first()->name);
    }

    /**
     * Test 8: Customer belongs to the correct tenant when applicable.
     */
    public function test_customer_belongs_to_the_correct_tenant_when_applicable(): void
    {
        $tenant = Tenant::factory()->create(['name' => 'Store Front']);
        $customer = User::factory()->create(['name' => 'Shopper']);
        $customer->assignRole('Customer');
        $customer->tenants()->attach($tenant->id);

        $this->assertTrue($customer->tenants->contains($tenant));
        $this->assertEquals('Store Front', $customer->tenants()->first()->name);
    }

    /**
     * Test 9 & 11: A user cannot access a tenant they do not belong to, returning 403 Forbidden.
     */
    public function test_user_cannot_access_a_tenant_they_do_not_belong_to(): void
    {
        $tenantAllowed = Tenant::factory()->create(['name' => 'Allowed Store']);
        $tenantForbidden = Tenant::factory()->create(['name' => 'Forbidden Store']);

        $user = User::factory()->create();
        $user->assignRole('Merchant');
        $user->tenants()->attach($tenantAllowed->id);

        $token = $user->createToken('auth-token')->plainTextToken;

        // Attempt accessing tenantForbidden via X-Tenant-ID header
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Tenant-ID', (string) $tenantForbidden->id)
            ->getJson('/api/v1/tenant/current');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized tenant access.',
            ]);
    }

    /**
     * Test 10: Tenant context resolves the correct tenant.
     */
    public function test_tenant_context_resolves_the_correct_tenant(): void
    {
        $tenant1 = Tenant::factory()->create(['name' => 'Store One']);
        $tenant2 = Tenant::factory()->create(['name' => 'Store Two']);

        $user = User::factory()->create();
        $user->assignRole('Merchant');
        $user->tenants()->attach([$tenant1->id, $tenant2->id]);

        $token = $user->createToken('auth-token')->plainTextToken;

        // 1. Without header: resolves default (first) tenant
        $respDefault = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/tenant/current');

        $respDefault->assertStatus(200)
            ->assertJson([
                'tenant' => [
                    'id' => $tenant1->id,
                    'name' => 'Store One',
                ],
            ]);

        // 2. With header for Tenant 2: resolves Tenant 2
        $respTenant2 = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Tenant-ID', (string) $tenant2->id)
            ->getJson('/api/v1/tenant/current');

        $respTenant2->assertStatus(200)
            ->assertJson([
                'tenant' => [
                    'id' => $tenant2->id,
                    'name' => 'Store Two',
                ],
            ]);

        // 3. Direct service test for TenantContext
        $context = app(TenantContextInterface::class);
        $this->assertTrue($context->hasTenant());
        $this->assertEquals($tenant2->id, $context->id());

        // Test clearing and re-setting
        $context->setTenant(null);
        $this->assertFalse($context->hasTenant());

        $context->setTenant($tenant1);
        $this->assertTrue($context->hasTenant());
        $this->assertEquals($tenant1->id, $context->id());
        $this->assertEquals('Store One', $context->getTenant()->name);
    }

    /**
     * Test 11: Unauthorized tenant access returns an appropriate HTTP status (user with no tenants).
     */
    public function test_user_with_no_tenants_cannot_access_tenant_routes(): void
    {
        $userWithoutTenant = User::factory()->create();
        $userWithoutTenant->assignRole('Customer');
        $token = $userWithoutTenant->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/tenant/current');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'No accessible tenant found for this user.',
            ]);
    }

    /**
     * Test 12: Duplicate tenant membership is prevented.
     */
    public function test_duplicate_tenant_membership_is_prevented(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create();

        // Attach first time
        DB::table('tenant_users')->insert([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertEquals(1, DB::table('tenant_users')->where('tenant_id', $tenant->id)->where('user_id', $user->id)->count());

        // Attempting to attach second time should fail unique constraint
        $this->expectException(QueryException::class);

        DB::table('tenant_users')->insert([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
