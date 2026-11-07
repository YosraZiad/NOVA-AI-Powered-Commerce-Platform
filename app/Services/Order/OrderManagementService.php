<?php

namespace App\Services\Order;

use App\Models\Order;
use App\Models\Product;
use App\Models\Scopes\TenantScope;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderManagementService
{
    /**
     * Update order lifecycle status with automatic inventory restock on cancellation.
     *
     * @param Order $order
     * @param string $newStatus
     * @return Order
     * @throws ValidationException
     */
    public function updateStatus(Order $order, string $newStatus): Order
    {
        return DB::transaction(function () use ($order, $newStatus) {
            $currentStatus = $order->status;

            if ($currentStatus === $newStatus) {
                return $order;
            }

            // A cancelled order is terminal; it cannot be transitioned back to active status
            if ($currentStatus === 'cancelled' && $newStatus !== 'cancelled') {
                throw ValidationException::withMessages([
                    'status' => ['لا يمكن تعديل حالة طلب تم إلغاؤه مسبقاً لحماية تكامل المخزون.'],
                ]);
            }

            // If cancelling an active order, restore product inventory atomically
            if ($newStatus === 'cancelled' && $currentStatus !== 'cancelled') {
                $order->loadMissing('items');
                foreach ($order->items as $item) {
                    Product::withoutGlobalScope(TenantScope::class)
                        ->where('id', $item->product_id)
                        ->increment('stock_quantity', $item->quantity);
                }
            }

            $order->status = $newStatus;
            $order->save();

            return $order->loadMissing('items');
        });
    }

    /**
     * Update order payment status.
     *
     * @param Order $order
     * @param string $paymentStatus
     * @return Order
     */
    public function updatePaymentStatus(Order $order, string $paymentStatus): Order
    {
        $order->payment_status = $paymentStatus;
        $order->save();

        return $order;
    }
}
