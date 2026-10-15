<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /**
     * Test 1: User can register.
     */
    public function test_user_can_register(): void
    {
        $payload = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
            'phone' => '+1234567890',
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'phone',
                    'status',
                    'roles',
                    'created_at',
                    'updated_at',
                ],
                'token',
            ])
            ->assertJson([
                'user' => [
                    'name' => 'John Doe',
                    'email' => 'john@example.com',
                    'phone' => '+1234567890',
                    'status' => 'active',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'name' => 'John Doe',
        ]);
    }

    /**
     * Test 2: User can login.
     */
    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'email' => 'testlogin@example.com',
            'password' => bcrypt('Password123!'),
            'status' => 'active',
        ]);
        $user->assignRole('Customer');

        $payload = [
            'email' => 'testlogin@example.com',
            'password' => 'Password123!',
        ];

        $response = $this->postJson('/api/v1/auth/login', $payload);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'roles',
                ],
                'token',
            ]);

        $this->assertNotEmpty($response->json('token'));
    }

    /**
     * Test 3: User can logout.
     */
    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Customer');
        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Logged out successfully.',
            ]);

        $this->assertCount(0, $user->fresh()->tokens);
    }

    /**
     * Test 4: Authenticated user can access /auth/me.
     */
    public function test_authenticated_user_can_access_auth_me(): void
    {
        $user = User::factory()->create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
        ]);
        $user->assignRole('Customer');
        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                    'roles',
                    'current_tenant',
                ],
            ])
            ->assertJson([
                'user' => [
                    'name' => 'Jane Smith',
                    'email' => 'jane@example.com',
                ],
            ]);
    }

    /**
     * Test 5: Passwords are not exposed in API responses.
     */
    public function test_passwords_are_not_exposed_in_api_responses(): void
    {
        // 1. Registration response
        $regResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Hidden Password User',
            'email' => 'nopass@example.com',
            'password' => 'SecretPassword123!',
            'password_confirmation' => 'SecretPassword123!',
        ]);

        $regResponse->assertStatus(201);
        $this->assertArrayNotHasKey('password', $regResponse->json('user'));
        $this->assertStringNotContainsString('SecretPassword123!', $regResponse->getContent());

        // 2. Login response
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'nopass@example.com',
            'password' => 'SecretPassword123!',
        ]);

        $loginResponse->assertStatus(200);
        $this->assertArrayNotHasKey('password', $loginResponse->json('user'));
        $this->assertStringNotContainsString('SecretPassword123!', $loginResponse->getContent());

        // 3. Me response
        $token = $loginResponse->json('token');
        $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');

        $meResponse->assertStatus(200);
        $this->assertArrayNotHasKey('password', $meResponse->json('user'));
    }

    /**
     * Test 6: Roles are assigned correctly upon registration.
     */
    public function test_roles_are_assigned_correctly_on_registration(): void
    {
        // Default role is Customer
        $customerResp = $this->postJson('/api/v1/auth/register', [
            'name' => 'Default Customer',
            'email' => 'defaultcustomer@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $customerResp->assertStatus(201);
        $this->assertContains('Customer', $customerResp->json('user.roles'));

        // Attempted Merchant registration via public API is strictly rejected (Commercial Model Hardening)
        $merchantResp = $this->postJson('/api/v1/auth/register', [
            'name' => 'New Merchant',
            'email' => 'newmerchant@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'Merchant',
            'tenant_name' => 'Super Store',
        ]);

        $merchantResp->assertStatus(422);
        $merchantResp->assertJsonValidationErrors(['role', 'tenant_name']);
    }
}
