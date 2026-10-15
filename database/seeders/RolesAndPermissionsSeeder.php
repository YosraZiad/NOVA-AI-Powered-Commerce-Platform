<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Required Permissions
        $permissions = [
            'categories.view',
            'categories.create',
            'categories.update',
            'categories.delete',
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

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // 2. Required Roles and Sensible Permission Assignments
        $rolePlatformAdmin = Role::firstOrCreate(['name' => 'Platform Admin', 'guard_name' => 'web']);
        $rolePlatformAdmin->syncPermissions(Permission::all());

        $roleMerchant = Role::firstOrCreate(['name' => 'Merchant', 'guard_name' => 'web']);
        $roleMerchant->syncPermissions([
            'categories.view',
            'categories.create',
            'categories.update',
            'categories.delete',
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
        ]);

        $roleStaff = Role::firstOrCreate(['name' => 'Staff', 'guard_name' => 'web']);
        $roleStaff->syncPermissions([
            'categories.view',
            'categories.create',
            'categories.update',
            'products.view',
            'products.create',
            'products.update',
            'orders.view',
            'orders.update',
            'inventory.view',
            'inventory.update',
            'analytics.view',
            'ai.use',
        ]);

        $roleCustomer = Role::firstOrCreate(['name' => 'Customer', 'guard_name' => 'web']);
        $roleCustomer->syncPermissions([
            'categories.view',
            'products.view',
            'ai.use',
        ]);
    }
}
