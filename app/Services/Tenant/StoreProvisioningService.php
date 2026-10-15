<?php

namespace App\Services\Tenant;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StoreProvisioningService
{
    /**
     * Provision a new store tenant and assign an authorized merchant owner.
     * This service is restricted to authorized platform administrators and seeders.
     *
     * @param  array<string, mixed>  $data
     * @return array{tenant: Tenant, owner: User}
     */
    public function provision(array $data): array
    {
        return DB::transaction(function () use ($data) {
            // 1. Generate unique tenant slug
            $baseSlug = !empty($data['slug']) ? Str::slug($data['slug']) : Str::slug($data['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (Tenant::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter++;
            }

            // 2. Create the store tenant
            $tenant = Tenant::create([
                'name' => $data['name'],
                'slug' => $slug,
                'currency' => $data['currency'] ?? 'SAR',
                'description' => $data['description'] ?? null,
                'status' => $data['status'] ?? 'active',
                'settings' => $data['settings'] ?? [
                    'theme' => 'default',
                    'timezone' => 'Asia/Riyadh',
                    'notifications_enabled' => true,
                ],
            ]);

            // 3. Resolve or create Merchant Owner
            if (!empty($data['owner_id'])) {
                $owner = User::findOrFail($data['owner_id']);
            } else {
                $ownerEmail = $data['owner_email'];
                $owner = User::where('email', $ownerEmail)->first();

                if (!$owner) {
                    $owner = User::create([
                        'name' => $data['owner_name'] ?? $data['name'] . ' Owner',
                        'email' => $ownerEmail,
                        'password' => Hash::make($data['owner_password'] ?? Str::random(16)),
                        'phone' => $data['owner_phone'] ?? null,
                        'status' => 'active',
                        'email_verified_at' => now(),
                    ]);
                }
            }

            // 4. Assign Merchant Role & attach to Tenant
            if (!$owner->hasRole('Merchant')) {
                $owner->assignRole('Merchant');
            }

            $owner->tenants()->syncWithoutDetaching([$tenant->id]);

            return [
                'tenant' => $tenant->fresh(['users']),
                'owner' => $owner,
            ];
        });
    }
}
