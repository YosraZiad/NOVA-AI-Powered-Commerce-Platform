<?php

namespace App\Policies;

use App\Contracts\TenantContextInterface;
use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    /**
     * Determine whether the user can view any categories.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('categories.view');
    }

    /**
     * Determine whether the user can view the category.
     */
    public function view(User $user, Category $category): bool
    {
        $currentTenantId = app(TenantContextInterface::class)->id();

        return $user->can('categories.view')
            && (int) $category->tenant_id === (int) $currentTenantId
            && $user->tenants()->where('tenants.id', $category->tenant_id)->exists();
    }

    /**
     * Determine whether the user can create categories.
     */
    public function create(User $user): bool
    {
        return $user->can('categories.create');
    }

    /**
     * Determine whether the user can update the category.
     */
    public function update(User $user, Category $category): bool
    {
        $currentTenantId = app(TenantContextInterface::class)->id();

        return $user->can('categories.update')
            && (int) $category->tenant_id === (int) $currentTenantId
            && $user->tenants()->where('tenants.id', $category->tenant_id)->exists();
    }

    /**
     * Determine whether the user can delete the category.
     */
    public function delete(User $user, Category $category): bool
    {
        $currentTenantId = app(TenantContextInterface::class)->id();

        return $user->can('categories.delete')
            && (int) $category->tenant_id === (int) $currentTenantId
            && $user->tenants()->where('tenants.id', $category->tenant_id)->exists();
    }
}
