<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. One Demo Tenant
        $demoTenant = Tenant::firstOrCreate(
            ['slug' => 'demo-store'],
            [
                'name' => 'Demo Store',
                'logo' => null,
                'description' => 'Demo store for NOVA AI-Powered Commerce Platform',
                'currency' => 'USD',
                'status' => 'active',
                'settings' => [
                    'theme' => 'default',
                    'timezone' => 'UTC',
                    'notifications_enabled' => true,
                ],
            ]
        );

        // 2. One Platform Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@nova.test'],
            [
                'name' => 'Platform Administrator',
                'password' => Hash::make('password'),
                'phone' => '+10000000001',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
        $admin->syncRoles(['Platform Admin']);

        // 3. One Merchant User (associated with demo store)
        $merchant = User::firstOrCreate(
            ['email' => 'merchant@nova.test'],
            [
                'name' => 'Demo Merchant',
                'password' => Hash::make('password'),
                'phone' => '+10000000002',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
        $merchant->syncRoles(['Merchant']);

        if (!$merchant->tenants()->where('tenants.id', $demoTenant->id)->exists()) {
            $merchant->tenants()->attach($demoTenant->id);
        }

        // 4. One Customer User (associated with demo store)
        $customer = User::firstOrCreate(
            ['email' => 'customer@nova.test'],
            [
                'name' => 'Demo Customer',
                'password' => Hash::make('password'),
                'phone' => '+10000000003',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
        $customer->syncRoles(['Customer']);

        if (!$customer->tenants()->where('tenants.id', $demoTenant->id)->exists()) {
            $customer->tenants()->attach($demoTenant->id);
        }

        // 5. One Staff User (associated with demo store)
        $staff = User::firstOrCreate(
            ['email' => 'staff@nova.test'],
            [
                'name' => 'Demo Staff',
                'password' => Hash::make('password'),
                'phone' => '+10000000004',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
        $staff->syncRoles(['Staff']);

        if (!$staff->tenants()->where('tenants.id', $demoTenant->id)->exists()) {
            $staff->tenants()->attach($demoTenant->id);
        }

        // 6. Second Demo Tenant (Store Beta) for live isolation testing
        $betaTenant = Tenant::firstOrCreate(
            ['slug' => 'beta-store'],
            [
                'name' => 'Store Beta (Second Store)',
                'logo' => null,
                'description' => 'Second independent store for cross-tenant isolation testing',
                'currency' => 'EUR',
                'status' => 'active',
                'settings' => ['theme' => 'dark'],
            ]
        );

        $merchantBeta = User::firstOrCreate(
            ['email' => 'merchant.beta@nova.test'],
            [
                'name' => 'Beta Merchant',
                'password' => Hash::make('password'),
                'phone' => '+10000000005',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
        $merchantBeta->syncRoles(['Merchant']);

        if (!$merchantBeta->tenants()->where('tenants.id', $betaTenant->id)->exists()) {
            $merchantBeta->tenants()->attach($betaTenant->id);
        }
    }
}
