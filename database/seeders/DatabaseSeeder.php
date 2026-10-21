<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
        ]);

        // Restrict demo accounts and demo catalog to local/development/testing environments
        if (!app()->environment('production')) {
            $this->call([
                DemoDataSeeder::class,
                ProductCatalogSeeder::class,
            ]);
        }
    }
}
