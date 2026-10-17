<?php

namespace App\Services\Order;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    /**
     * Execute atomic order creation and inventory deduction.
     *
     * @param Tenant $tenant The active storefront store
     * @param array<string, mixed> $validatedData Customer and items payload
     * @param int|null $userId Authenticated user ID, if any
     * @return Order
     * @throws ValidationException
     */
    public function placeOrder(Tenant $tenant, array $validatedData, ?int $userId = null): Order
    {
        return DB::transaction(function () use ($tenant, $validatedData, $userId) {
            $itemsData = $validatedData['items'] ?? [];
            $productIds = collect($itemsData)->pluck('product_id')->unique()->values()->all();

            // 1. Fetch products with row locks (lockForUpdate) strictly scoped to this tenant
            $products = Product::withoutGlobalScope(TenantScope::class)
                ->where('tenant_id', $tenant->id)
                ->whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            // Verify all requested products exist and belong to this tenant
            foreach ($itemsData as $item) {
                $productId = $item['product_id'];
                if (!$products->has($productId)) {
                    throw ValidationException::withMessages([
                        'items' => ["المنتج رقم ({$productId}) غير متوفر في هذا المتجر."],
                    ]);
                }

                $product = $products->get($productId);

                if ($product->status !== 'active') {
                    throw ValidationException::withMessages([
                        'items' => ["المنتج \"{$product->name}\" غير متاح للطلب حالياً."],
                    ]);
                }

                $requestedQty = (int) $item['quantity'];

                // Verify stock availability
                if ($product->stock_quantity < $requestedQty) {
                    throw ValidationException::withMessages([
                        'items' => ["الكمية المطلوبة من \"{$product->name}\" تتجاوز المخزون المتوفر ({$product->stock_quantity} قطعة)."],
                    ]);
                }
            }

            // 2. Calculate financial totals using server-side prices only
            $subtotal = 0.00;
            $orderItems = [];

            foreach ($itemsData as $item) {
                /** @var Product $product */
                $product = $products->get($item['product_id']);
                $qty = (int) $item['quantity'];
                $unitPrice = (float) $product->price;

                // Check variant if provided
                $variantId = $item['variant_id'] ?? null;
                $variant = null;
                if ($variantId) {
                    $variant = ProductVariant::where('product_id', $product->id)->find($variantId);
                    if ($variant && $variant->price !== null) {
                        $unitPrice = (float) $variant->price;
                    }
                }

                $lineTotal = round($unitPrice * $qty, 2);
                $subtotal += $lineTotal;

                // Decrement stock
                $product->stock_quantity -= $qty;
                $product->save();

                $orderItems[] = [
                    'product_id' => $product->id,
                    'product_variant_id' => $variant?->id,
                    'product_name' => $product->name,
                    'product_sku' => $variant?->sku ?? $product->sku,
                    'unit_price' => $unitPrice,
                    'quantity' => $qty,
                    'line_total' => $lineTotal,
                ];
            }

            // Shipping policy: Free shipping for orders >= 200 SAR, otherwise 25 SAR
            $shippingFee = $subtotal >= 200 ? 0.00 : 25.00;
            $taxAmount = round($subtotal * 0.15, 2); // 15% VAT standard in Saudi Arabia
            $grandTotal = round($subtotal + $shippingFee, 2);

            // Generate unique human-readable order number
            $orderNumber = 'NOVA-' . strtoupper(Str::random(6));
            while (Order::withoutGlobalScope(TenantScope::class)->where('order_number', $orderNumber)->exists()) {
                $orderNumber = 'NOVA-' . strtoupper(Str::random(6));
            }

            // 3. Create Order
            $order = new Order([
                'user_id' => $userId,
                'order_number' => $orderNumber,
                'status' => 'pending',
                'customer_name' => $validatedData['customer_name'],
                'customer_email' => $validatedData['customer_email'] ?? null,
                'customer_phone' => $validatedData['customer_phone'],
                'shipping_city' => $validatedData['shipping_city'],
                'shipping_address' => $validatedData['shipping_address'],
                'shipping_notes' => $validatedData['shipping_notes'] ?? null,
                'payment_method' => $validatedData['payment_method'],
                'payment_status' => $validatedData['payment_method'] === 'cod' ? 'pending' : 'paid',
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'shipping_fee' => $shippingFee,
                'discount_amount' => 0.00,
                'total' => $grandTotal,
                'currency' => $tenant->currency ?: 'SAR',
                'notes' => $validatedData['notes'] ?? null,
            ]);

            // Set tenant_id directly on model instance to bypass context dependency during public checkout
            $order->tenant_id = $tenant->id;
            $order->save();

            // 4. Create line items
            foreach ($orderItems as $itemRecord) {
                $order->items()->create($itemRecord);
            }

            return $order->load(['items', 'tenant']);
        });
    }
}
