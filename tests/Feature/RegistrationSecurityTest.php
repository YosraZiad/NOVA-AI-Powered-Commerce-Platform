<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Services\Auth\AuthService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class RegistrationSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /**
     * Rule 1: Public registration must assign Customer by default.
     */
    public function test_default_registration_creates_a_customer(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Alice Customer',
            'email' => 'alice@customer.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'alice@customer.test')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('Customer'));
        $this->assertFalse($user->hasRole('Platform Admin'));
        $this->assertFalse($user->hasRole('Staff'));
        $this->assertFalse($user->hasRole('Merchant'));

        // Customer permissions
        $this->assertTrue($user->hasPermissionTo('products.view'));
        $this->assertTrue($user->hasPermissionTo('ai.use'));

        // Forbidden merchant / admin permissions
        $this->assertFalse($user->hasPermissionTo('products.create'));
        $this->assertFalse($user->hasPermissionTo('orders.update'));
        $this->assertFalse($user->hasPermissionTo('ai.manage'));
    }

    /**
     * Rule 2: Attempts to register as Platform Admin via API are rejected.
     */
    public function test_attempt_to_register_as_platform_admin_is_rejected_via_api(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Hacker Admin',
            'email' => 'hacker@admin.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'Platform Admin',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);

        $this->assertDatabaseMissing('users', [
            'email' => 'hacker@admin.test',
        ]);
    }

    /**
     * Rule 2 (Defense in Depth): Direct service call with Platform Admin safely defaults to Customer.
     */
    public function test_attempt_to_register_as_platform_admin_via_service_safely_defaults_to_customer(): void
    {
        $authService = app(AuthService::class);

        $result = $authService->register([
            'name' => 'Bypassed Admin',
            'email' => 'bypassed@admin.test',
            'password' => 'Password123!',
            'role' => 'Platform Admin',
        ]);

        /** @var User $user */
        $user = $result['user'];
        $this->assertTrue($user->hasRole('Customer'));
        $this->assertFalse($user->hasRole('Platform Admin'));
        $this->assertFalse($user->hasPermissionTo('ai.manage'));
    }

    /**
     * Rule 2: Attempts to register as Staff via API are rejected.
     */
    public function test_attempt_to_register_as_staff_is_rejected_via_api(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Fake Staff',
            'email' => 'fake@staff.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'Staff',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);

        $this->assertDatabaseMissing('users', [
            'email' => 'fake@staff.test',
        ]);
    }

    /**
     * Rule 2 (Defense in Depth): Direct service call with Staff safely defaults to Customer.
     */
    public function test_attempt_to_register_as_staff_via_service_safely_defaults_to_customer(): void
    {
        $authService = app(AuthService::class);

        $result = $authService->register([
            'name' => 'Direct Staff',
            'email' => 'direct@staff.test',
            'password' => 'Password123!',
            'role' => 'Staff',
        ]);

        /** @var User $user */
        $user = $result['user'];
        $this->assertTrue($user->hasRole('Customer'));
        $this->assertFalse($user->hasRole('Staff'));
    }

    /**
     * Rule 2: Arbitrary role values cannot grant unauthorized permissions.
     */
    public function test_arbitrary_role_values_cannot_grant_unauthorized_permissions(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Arbitrary User',
            'email' => 'arbitrary@role.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'SuperAdministrator',
            'is_admin' => true,
            'roles' => ['Platform Admin'],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);

        $this->assertDatabaseMissing('users', [
            'email' => 'arbitrary@role.test',
        ]);
    }

    /**
     * Rule 3 & 5: Supplying tenant_name alongside malicious role input does not grant elevated privileges.
     */
    public function test_supplying_tenant_name_alongside_malicious_role_does_not_grant_elevated_privileges(): void
    {
        // 1. API level rejection
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Malicious Store Creator',
            'email' => 'malicious@store.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'Platform Admin',
            'tenant_name' => 'Trojan Store',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);

        // 2. Service level defense-in-depth: Even if passed to service, role is strictly Customer
        $authService = app(AuthService::class);
        $result = $authService->register([
            'name' => 'Direct Trojan',
            'email' => 'directtrojan@store.test',
            'password' => 'Password123!',
            'role' => 'Platform Admin',
            'tenant_name' => 'Trojan Store',
        ]);

        /** @var User $user */
        $user = $result['user'];
        $this->assertTrue($user->hasRole('Customer'));
        $this->assertFalse($user->hasRole('Platform Admin'));
        $this->assertFalse($user->hasPermissionTo('ai.manage'));
    }

    /**
     * Rule 3: Public registration strictly rejects attempts to register as Merchant or create stores.
     */
    public function test_attempt_to_register_as_merchant_is_rejected_via_api(): void
    {
        // A. Attempting Merchant role registration is rejected
        $respRole = $this->postJson('/api/v1/auth/register', [
            'name' => 'Bob Merchant',
            'email' => 'bob@merchant.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'Merchant',
        ]);

        $respRole->assertStatus(422)
            ->assertJsonValidationErrors(['role']);

        // B. Attempting to submit tenant_name via public registration is prohibited
        $respTenant = $this->postJson('/api/v1/auth/register', [
            'name' => 'Store Creator',
            'email' => 'creator@store.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'tenant_name' => 'Unauthorized Store',
        ]);

        $respTenant->assertStatus(422)
            ->assertJsonValidationErrors(['tenant_name']);
    }

    /**
     * Rule 3 (Controlled Provisioning): Store creation and merchant onboarding succeeds via Platform Admin workflow.
     */
    public function test_authorized_platform_admin_can_provision_store_and_assign_merchant_owner(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Platform Admin');

        $provisionResp = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/platform/tenants', [
            'name' => 'Bob Gadgets',
            'currency' => 'SAR',
            'owner_name' => 'Bob Merchant',
            'owner_email' => 'bob@merchant.test',
            'owner_password' => 'Password123!',
        ]);

        $provisionResp->assertStatus(201);
        $user = User::where('email', 'bob@merchant.test')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('Merchant'));
        $this->assertFalse($user->hasRole('Platform Admin'));
        $this->assertTrue($user->hasPermissionTo('products.create'));
        $this->assertTrue($user->hasPermissionTo('orders.update'));

        $this->assertEquals(1, $user->tenants()->count());
        $this->assertEquals('Bob Gadgets', $user->tenants()->first()->name);
    }

    /**
     * Rule 5: User-supplied tenant_id does not attach user to an existing tenant.
     */
    public function test_user_supplied_tenant_id_does_not_attach_user_to_existing_tenant(): void
    {
        $existingTenant = Tenant::factory()->create([
            'name' => 'Victim Store',
        ]);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Intruder User',
            'email' => 'intruder@store.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'tenant_id' => $existingTenant->id,
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'intruder@store.test')->first();
        $this->assertNotNull($user);
        $this->assertFalse($user->tenants->contains($existingTenant));
        $this->assertEquals(0, $user->tenants()->count());
    }

    /**
     * Rule 4: Tenant creation and membership roll back together if provisioning fails.
     */
    public function test_tenant_creation_and_membership_roll_back_together_if_an_operation_fails(): void
    {
        $initialUserCount = User::count();
        $initialTenantCount = Tenant::count();

        Tenant::creating(function () {
            throw new \RuntimeException('Simulated failure during tenant onboarding');
        });

        try {
            $provisioningService = app(\App\Services\Tenant\StoreProvisioningService::class);
            $provisioningService->provision([
                'name' => 'Failed Store',
                'owner_name' => 'Failing Merchant',
                'owner_email' => 'failing@merchant.test',
                'owner_password' => 'Password123!',
            ]);
            $this->fail('Expected exception was not thrown');
        } catch (\RuntimeException $e) {
            $this->assertEquals('Simulated failure during tenant onboarding', $e->getMessage());
        }

        // Clean up event listener
        Tenant::flushEventListeners();

        // Verify transaction was rolled back: neither user nor tenant was saved
        $this->assertEquals($initialUserCount, User::count());
        $this->assertEquals($initialTenantCount, Tenant::count());
        $this->assertDatabaseMissing('users', ['email' => 'failing@merchant.test']);
        $this->assertDatabaseMissing('tenants', ['name' => 'Failed Store']);
    }
}
