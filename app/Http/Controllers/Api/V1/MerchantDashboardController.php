<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\TenantContextInterface;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class MerchantDashboardController extends Controller
{
    public function __construct(
        protected TenantContextInterface $tenantContext
    ) {}

    /**
     * Get real-time overview metrics for the merchant dashboard.
     */
    public function metrics(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user?->can('analytics.view') && !$user?->hasAnyRole(['Merchant', 'Staff', 'Platform Admin'])) {
            return response()->json([
                'message' => 'Unauthorized. Merchant permission required.',
            ], Response::HTTP_FORBIDDEN);
        }

        $tenant = $this->tenantContext->getTenant();

        if (!$tenant) {
            return response()->json([
                'message' => 'No active tenant in context.',
            ], Response::HTTP_NOT_FOUND);
        }

        $tenantId = $tenant->id;
        $currency = $tenant->currency ?: 'SAR';
        $lowStockThreshold = (int) ($tenant->settings['low_stock_threshold'] ?? 5);

        // 1. Order Status Counts
        $totalOrders = Order::where('tenant_id', $tenantId)->count();
        $pendingOrders = Order::where('tenant_id', $tenantId)->where('status', 'pending')->count();
        $processingOrders = Order::where('tenant_id', $tenantId)->where('status', 'processing')->count();
        $completedOrders = Order::where('tenant_id', $tenantId)->where('status', 'completed')->count();
        $cancelledOrders = Order::where('tenant_id', $tenantId)->where('status', 'cancelled')->count();

        // 2. Revenue (Calculated from paid or completed orders, excluding cancelled)
        $totalRevenue = (float) Order::where('tenant_id', $tenantId)
            ->where(function ($q) {
                $q->where('payment_status', 'paid')
                  ->orWhere('status', 'completed');
            })
            ->where('status', '!=', 'cancelled')
            ->sum('total');

        // 3. Product Catalog & Inventory Metrics
        $totalProducts = Product::where('tenant_id', $tenantId)->count();
        $activeProducts = Product::where('tenant_id', $tenantId)->where('status', 'active')->count();
        $totalInventoryUnits = (int) Product::where('tenant_id', $tenantId)->sum('stock_quantity');
        $totalInventoryValue = (float) Product::where('tenant_id', $tenantId)
            ->selectRaw('SUM(price * stock_quantity) as total_val')
            ->value('total_val') ?: 0.0;

        $lowStockCount = Product::where('tenant_id', $tenantId)
            ->where('stock_quantity', '<=', $lowStockThreshold)
            ->count();

        $lowStockProducts = Product::where('tenant_id', $tenantId)
            ->where('stock_quantity', '<=', $lowStockThreshold)
            ->select('id', 'name', 'sku', 'stock_quantity', 'price')
            ->orderBy('stock_quantity', 'asc')
            ->limit(10)
            ->get();

        // 4. Recent Orders (Latest 5)
        $recentOrders = Order::where('tenant_id', $tenantId)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_name,
                'customer_city' => $order->shipping_city,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'total' => (float) $order->total,
                'currency' => $order->currency ?: $currency,
                'created_at' => $order->created_at?->toIso8601String(),
            ]);

        // 5. Best-Selling Products from actual Order Items
        $bestSellers = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.tenant_id', $tenantId)
            ->where('orders.status', '!=', 'cancelled')
            ->select(
                'order_items.product_id',
                'order_items.product_name',
                DB::raw('SUM(order_items.quantity) as total_units_sold'),
                DB::raw('SUM(order_items.line_total) as total_sales_amount')
            )
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('total_units_sold')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'product_id' => $row->product_id,
                'product_name' => $row->product_name,
                'units_sold' => (int) $row->total_units_sold,
                'sales_amount' => (float) $row->total_sales_amount,
            ]);

        // 6. Real Daily Sales for the past 7 days
        $days = 7;
        $salesTrend = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dayRevenue = (float) Order::where('tenant_id', $tenantId)
                ->whereDate('created_at', $date)
                ->where('status', '!=', 'cancelled')
                ->where(function ($q) {
                    $q->where('payment_status', 'paid')
                      ->orWhere('status', 'completed');
                })
                ->sum('total');

            $orderCount = Order::where('tenant_id', $tenantId)
                ->whereDate('created_at', $date)
                ->count();

            $salesTrend[] = [
                'date' => $date->format('Y-m-d'),
                'day_name' => $date->translatedFormat('l') ?: $date->format('l'),
                'label' => $date->translatedFormat('l') ?: $date->format('l'),
                'revenue' => $dayRevenue,
                'orders_count' => $orderCount,
            ];
        }

        return response()->json([
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'currency' => $currency,
                'low_stock_threshold' => $lowStockThreshold,
            ],
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_orders' => $totalOrders,
                'pending_orders' => $pendingOrders,
                'processing_orders' => $processingOrders,
                'completed_orders' => $completedOrders,
                'cancelled_orders' => $cancelledOrders,
                'total_products' => $totalProducts,
                'active_products' => $activeProducts,
                'total_inventory_units' => $totalInventoryUnits,
                'total_inventory_value' => $totalInventoryValue,
                'low_stock_products_count' => $lowStockCount,
            ],
            'low_stock_products' => $lowStockProducts,
            'recent_orders' => $recentOrders,
            'best_sellers' => $bestSellers,
            'sales_trend' => $salesTrend,
        ]);
    }
}
