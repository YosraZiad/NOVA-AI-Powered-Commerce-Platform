<?php

namespace App\Policies;

use App\Contracts\TenantContextInterface;
use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    /**
     * Determine whether the user can view any products.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('products.view');
    }

    /**
     * Determine whether the user can view the product.
     */
    public function view(User $user, Product $product): bool
    {
        $currentTenantId = app(TenantContextInterface::class)->id();

        return $user->can('products.view')
            && (int) $product->tenant_id === (int) $currentTenantId
            && $user->tenants()->where('tenants.id', $product->tenant_id)->exists();
    }

    /**
     * Determine whether the user can create products.
     */
    public function create(User $user): bool
    {
        return $user->can('products.create');
    }

    /**
     * Determine whether the user can update the product.
     */
    public function update(User $user, Product $product): bool
    {
        $currentTenantId = app(TenantContextInterface::class)->id();

        return $user->can('products.update')
            && (int) $product->tenant_id === (int) $currentTenantId
            && $user->tenants()->where('tenants.id', $product->tenant_id)->exists();
    }

    /**
     * Determine whether the user can delete the product.
     */
    public function delete(User $user, Product $product): bool
    {
        $currentTenantId = app(TenantContextInterface::class)->id();

        return $user->can('products.delete')
            && (int) $product->tenant_id === (int) $currentTenantId
            && $user->tenants()->where('tenants.id', $product->tenant_id)->exists();
    }
}
