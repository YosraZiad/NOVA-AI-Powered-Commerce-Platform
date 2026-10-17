<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * Determine whether the user can view any orders.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('Platform Admin') || $user->can('orders.view');
    }

    /**
     * Determine whether the user can view the order.
     */
    public function view(User $user, Order $order): bool
    {
        if ($user->hasRole('Platform Admin')) {
            return true;
        }

        // Customer viewing their own order
        if ($order->user_id && $order->user_id === $user->id) {
            return true;
        }

        // Store staff or merchant viewing tenant order
        return $user->can('orders.view') && $user->tenants()->where('tenants.id', $order->tenant_id)->exists();
    }

    /**
     * Determine whether the user can update the order.
     */
    public function update(User $user, Order $order): bool
    {
        if ($user->hasRole('Platform Admin')) {
            return true;
        }

        return $user->can('orders.update') && $user->tenants()->where('tenants.id', $order->tenant_id)->exists();
    }
}
