<?php

namespace App\Services\AI\Merchant;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MerchantAnalyticsAggregator
{
    /**
     * Compute comprehensive, mathematically verified business metrics for a tenant.
     *
     * @param Tenant $tenant
     * @param string $period 'today' | '7d' | '30d' | 'month' | 'all'
     * @return array
     */
    public function getPerformanceMetrics(Tenant $tenant, string $period = '30d'): array
    {
        $tenantId = $tenant->id;
        $currency = $tenant->currency ?: 'SAR';
        $lowStockThreshold = (int) ($tenant->settings['low_stock_threshold'] ?? 5);

        [$startDate, $endDate, $prevStartDate, $prevEndDate, $periodLabel] = $this->resolveDateRanges($period);

        // 1. Current Period Orders & Revenue
        $currentOrdersQuery = Order::where('tenant_id', $tenantId)
            ->where('status', '!=', 'cancelled');

        if ($startDate && $endDate) {
            $currentOrdersQuery->whereBetween('created_at', [$startDate, $endDate]);
        }

        $currentOrders = $currentOrdersQuery->get();

        $currentPaidOrders = $currentOrders->filter(function ($order) {
            return $order->payment_status === 'paid' || $order->status === 'completed';
        });

        $currentRevenue = (float) $currentPaidOrders->sum('total');
        $currentOrderCount = $currentOrders->count();
        $currentAov = $currentPaidOrders->count() > 0 ? round($currentRevenue / $currentPaidOrders->count(), 2) : 0.0;

        // 2. Previous Period Orders & Revenue (for comparative trends)
        $prevRevenue = 0.0;
        $prevOrderCount = 0;
        $prevAov = 0.0;
        $hasComparison = false;

        if ($prevStartDate && $prevEndDate) {
            $hasComparison = true;
            $prevOrders = Order::where('tenant_id', $tenantId)
                ->where('status', '!=', 'cancelled')
                ->whereBetween('created_at', [$prevStartDate, $prevEndDate])
                ->get();

            $prevPaidOrders = $prevOrders->filter(function ($order) {
                return $order->payment_status === 'paid' || $order->status === 'completed';
            });

            $prevRevenue = (float) $prevPaidOrders->sum('total');
            $prevOrderCount = $prevOrders->count();
            $prevAov = $prevPaidOrders->count() > 0 ? round($prevRevenue / $prevPaidOrders->count(), 2) : 0.0;
        }

        // Percentage Growth Calculations
        $revenueGrowth = $this->calculatePercentageChange($prevRevenue, $currentRevenue);
        $orderGrowth = $this->calculatePercentageChange((float) $prevOrderCount, (float) $currentOrderCount);
        $aovGrowth = $this->calculatePercentageChange($prevAov, $currentAov);

        // 3. Order Status Breakdown for Period
        $statusBreakdown = [
            'pending' => Order::where('tenant_id', $tenantId)->when($startDate, fn ($q) => $q->whereBetween('created_at', [$startDate, $endDate]))->where('status', 'pending')->count(),
            'processing' => Order::where('tenant_id', $tenantId)->when($startDate, fn ($q) => $q->whereBetween('created_at', [$startDate, $endDate]))->where('status', 'processing')->count(),
            'completed' => Order::where('tenant_id', $tenantId)->when($startDate, fn ($q) => $q->whereBetween('created_at', [$startDate, $endDate]))->where('status', 'completed')->count(),
            'cancelled' => Order::where('tenant_id', $tenantId)->when($startDate, fn ($q) => $q->whereBetween('created_at', [$startDate, $endDate]))->where('status', 'cancelled')->count(),
        ];

        // 4. Best-Selling Products in Period (by quantity and revenue)
        $salesItemsQuery = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.tenant_id', $tenantId)
            ->where('orders.status', '!=', 'cancelled');

        if ($startDate && $endDate) {
            $salesItemsQuery->whereBetween('orders.created_at', [$startDate, $endDate]);
        }

        $topSales = (clone $salesItemsQuery)
            ->select(
                'order_items.product_id',
                'order_items.product_name',
                DB::raw('SUM(order_items.quantity) as units_sold'),
                DB::raw('SUM(order_items.line_total) as total_sales')
            )
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('units_sold')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'product_id' => $r->product_id,
                'name' => $r->product_name,
                'units_sold' => (int) $r->units_sold,
                'revenue' => (float) $r->total_sales,
            ]);

        // 5. Inventory & Stock Status
        $products = Product::where('tenant_id', $tenantId)->get();
        $totalProducts = $products->count();
        $activeProducts = $products->where('status', 'active')->count();
        $totalUnitsInStock = (int) $products->sum('stock_quantity');
        $totalInventoryValue = (float) $products->sum(fn ($p) => (float) $p->price * (int) $p->stock_quantity);

        $outOfStockProducts = $products->where('stock_quantity', '<=', 0);
        $lowStockProducts = $products->filter(fn ($p) => $p->stock_quantity > 0 && $p->stock_quantity <= $lowStockThreshold);

        return [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'currency' => $currency,
            ],
            'period' => [
                'type' => $period,
                'label' => $periodLabel,
                'start' => $startDate?->toDateString(),
                'end' => $endDate?->toDateString(),
                'has_comparison' => $hasComparison,
                'prev_start' => $prevStartDate?->toDateString(),
                'prev_end' => $prevEndDate?->toDateString(),
            ],
            'current' => [
                'revenue' => $currentRevenue,
                'orders_count' => $currentOrderCount,
                'average_order_value' => $currentAov,
                'status_breakdown' => $statusBreakdown,
            ],
            'comparison' => $hasComparison ? [
                'prev_revenue' => $prevRevenue,
                'prev_orders_count' => $prevOrderCount,
                'prev_aov' => $prevAov,
                'revenue_growth_percentage' => $revenueGrowth,
                'orders_growth_percentage' => $orderGrowth,
                'aov_growth_percentage' => $aovGrowth,
            ] : null,
            'top_sellers' => $topSales->toArray(),
            'inventory_summary' => [
                'total_products' => $totalProducts,
                'active_products' => $activeProducts,
                'total_units' => $totalUnitsInStock,
                'total_value' => $totalInventoryValue,
                'out_of_stock_count' => $outOfStockProducts->count(),
                'low_stock_count' => $lowStockProducts->count(),
            ],
        ];
    }

    /**
     * Compute inventory velocity and stockout risk estimates.
     *
     * @param Tenant $tenant
     * @return array
     */
    public function getInventoryIntelligence(Tenant $tenant): array
    {
        $tenantId = $tenant->id;
        $currency = $tenant->currency ?: 'SAR';
        $lowStockThreshold = (int) ($tenant->settings['low_stock_threshold'] ?? 5);

        // Sales in past 30 days to calculate daily burn rate
        $thirtyDaysAgo = Carbon::now()->subDays(30);

        $recentSales = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.tenant_id', $tenantId)
            ->where('orders.status', '!=', 'cancelled')
            ->where('orders.created_at', '>=', $thirtyDaysAgo)
            ->select('order_items.product_id', DB::raw('SUM(order_items.quantity) as units_sold_30d'))
            ->groupBy('order_items.product_id')
            ->pluck('units_sold_30d', 'product_id');

        $products = Product::where('tenant_id', $tenantId)
            ->with('category')
            ->get();

        $items = [];
        $criticalCount = 0;
        $warningCount = 0;
        $healthyCount = 0;
        $slowMovingCount = 0;

        foreach ($products as $product) {
            $stock = (int) $product->stock_quantity;
            $sold30d = (int) ($recentSales[$product->id] ?? 0);
            $dailyVelocity = round($sold30d / 30.0, 2);

            $daysUntilStockout = null;
            $riskLevel = 'healthy'; // 'critical', 'warning', 'healthy', 'slow_moving', 'out_of_stock'
            $riskReason = 'المخزون متوازن مقارنة بحركة المبيعات الحالية.';

            if ($stock <= 0) {
                $riskLevel = 'out_of_stock';
                $daysUntilStockout = 0;
                $riskReason = 'المنتج نفد تماماً من المخزون وتوقف عن تحقيق المبيعات.';
            } elseif ($dailyVelocity > 0) {
                $daysUntilStockout = (int) floor($stock / $dailyVelocity);

                if ($daysUntilStockout <= 7) {
                    $riskLevel = 'critical';
                    $riskReason = sprintf('مخاطر نفاد وشيك خلال %d أيام بناءً على معدل بيع %.1f وحدة/يوم.', $daysUntilStockout, $dailyVelocity);
                    $criticalCount++;
                } elseif ($daysUntilStockout <= 14 || $stock <= $lowStockThreshold) {
                    $riskLevel = 'warning';
                    $riskReason = sprintf('مخزون منخفض يكفي لمدة %d يوماً تقريباً، ينصح بجدولة إعادة التوريد.', $daysUntilStockout);
                    $warningCount++;
                } else {
                    $riskLevel = 'healthy';
                    $healthyCount++;
                }
            } else {
                // No sales in 30 days
                if ($stock <= $lowStockThreshold) {
                    $riskLevel = 'warning';
                    $riskReason = 'المخزون منخفض، ولم تسجل مبيعات خلال آخر 30 يوماً.';
                    $warningCount++;
                } else {
                    $riskLevel = 'slow_moving';
                    $riskReason = 'منتج بطيء الحركة، لم يسجل أي مبيعات خلال آخر 30 يوماً مع توفر كمية جيدة.';
                    $slowMovingCount++;
                }
            }

            $items[] = [
                'product_id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'category_name' => $product->category?->name ?: 'عام',
                'stock_quantity' => $stock,
                'price' => (float) $product->price,
                'units_sold_30d' => $sold30d,
                'daily_velocity' => $dailyVelocity,
                'days_until_stockout' => $daysUntilStockout,
                'risk_level' => $riskLevel,
                'risk_reason' => $riskReason,
            ];
        }

        // Sort items: critical and out_of_stock first, then warning, then slow_moving
        $priorityOrder = ['out_of_stock' => 0, 'critical' => 1, 'warning' => 2, 'slow_moving' => 3, 'healthy' => 4];
        usort($items, fn ($a, $b) => ($priorityOrder[$a['risk_level']] ?? 5) <=> ($priorityOrder[$b['risk_level']] ?? 5));

        return [
            'summary' => [
                'total_products' => $products->count(),
                'out_of_stock_count' => $products->where('stock_quantity', '<=', 0)->count(),
                'critical_risk_count' => $criticalCount,
                'warning_count' => $warningCount,
                'healthy_count' => $healthyCount,
                'slow_moving_count' => $slowMovingCount,
            ],
            'items' => array_slice($items, 0, 25),
        ];
    }

    /**
     * Compute aggregated, privacy-conscious customer purchasing patterns.
     * Absolutely NO PII (passwords, emails, phones, tokens) is returned.
     *
     * @param Tenant $tenant
     * @return array
     */
    public function getAggregatedCustomerInsights(Tenant $tenant): array
    {
        $tenantId = $tenant->id;
        $currency = $tenant->currency ?: 'SAR';

        // 1. Customer order aggregation
        $customerGroups = Order::where('tenant_id', $tenantId)
            ->where('status', '!=', 'cancelled')
            ->select(
                'customer_phone',
                DB::raw('COUNT(id) as orders_count'),
                DB::raw("SUM(CASE WHEN payment_status = 'paid' OR status = 'completed' THEN total ELSE 0 END) as total_spent")
            )
            ->groupBy('customer_phone')
            ->get();

        $totalCustomers = $customerGroups->count();
        $repeatCustomers = $customerGroups->filter(fn ($c) => $c->orders_count > 1)->count();
        $repeatRate = $totalCustomers > 0 ? round(($repeatCustomers / $totalCustomers) * 100, 1) : 0.0;

        // Customer Value Tiers (Aggregated counts)
        $highValueCount = $customerGroups->filter(fn ($c) => $c->total_spent >= 1000)->count();
        $midValueCount = $customerGroups->filter(fn ($c) => $c->total_spent >= 300 && $c->total_spent < 1000)->count();
        $starterValueCount = $customerGroups->filter(fn ($c) => $c->total_spent < 300)->count();

        // 2. Geographic Distribution (Top 5 Cities)
        $topCities = Order::where('tenant_id', $tenantId)
            ->where('status', '!=', 'cancelled')
            ->whereNotNull('shipping_city')
            ->select('shipping_city', DB::raw('COUNT(id) as orders_count'), DB::raw('SUM(total) as revenue'))
            ->groupBy('shipping_city')
            ->orderByDesc('orders_count')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'city' => $r->shipping_city,
                'orders_count' => (int) $r->orders_count,
                'revenue' => (float) $r->revenue,
            ]);

        // 3. Category Preferences
        $topCategories = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->where('orders.tenant_id', $tenantId)
            ->where('orders.status', '!=', 'cancelled')
            ->select(
                DB::raw("COALESCE(categories.name, 'عام') as category_name"),
                DB::raw('SUM(order_items.quantity) as total_units'),
                DB::raw('SUM(order_items.line_total) as total_revenue')
            )
            ->groupBy(DB::raw("COALESCE(categories.name, 'عام')"))
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'category' => $r->category_name,
                'units' => (int) $r->total_units,
                'revenue' => (float) $r->total_revenue,
            ]);

        // Reliability assessment based on volume
        $dataReliability = 'high';
        $reliabilityNotice = 'حجم البيانات كافٍ لتقديم استنتاجات إحصائية دقيقة.';

        if ($totalCustomers < 5) {
            $dataReliability = 'low';
            $reliabilityNotice = 'حجم البيانات محدود جداً (أقل من 5 عملاء). الاستنتاجات أولية وينبغي جمع المزيد من الطلبات.';
        } elseif ($totalCustomers < 20) {
            $dataReliability = 'moderate';
            $reliabilityNotice = 'حجم البيانات متوسط. تمثل هذه الأنماط مؤشرات عامة قد تتغير مع نمو المبيعات.';
        }

        return [
            'overview' => [
                'total_unique_customers' => $totalCustomers,
                'repeat_customers_count' => $repeatCustomers,
                'repeat_purchase_rate' => $repeatRate,
                'currency' => $currency,
            ],
            'customer_segments' => [
                'high_value' => $highValueCount,
                'mid_value' => $midValueCount,
                'starter_value' => $starterValueCount,
            ],
            'geographic_distribution' => $topCities->toArray(),
            'category_preferences' => $topCategories->toArray(),
            'reliability' => [
                'level' => $dataReliability,
                'notice' => $reliabilityNotice,
            ],
        ];
    }

    /**
     * Resolve date ranges for given period keyword.
     */
    protected function resolveDateRanges(string $period): array
    {
        $now = Carbon::now();

        switch ($period) {
            case 'today':
                $start = Carbon::today();
                $end = Carbon::today()->endOfDay();
                $prevStart = Carbon::yesterday();
                $prevEnd = Carbon::yesterday()->endOfDay();
                $label = 'اليوم مقارنة بالأمس';
                break;

            case '7d':
                $start = Carbon::today()->subDays(6);
                $end = Carbon::today()->endOfDay();
                $prevStart = Carbon::today()->subDays(13);
                $prevEnd = Carbon::today()->subDays(7)->endOfDay();
                $label = 'آخر 7 أيام مقارنة بالـ 7 أيام السابقة';
                break;

            case 'month':
                $start = Carbon::now()->startOfMonth();
                $end = Carbon::now();
                $prevStart = Carbon::now()->subMonth()->startOfMonth();
                $prevEnd = Carbon::now()->subMonth()->endOfMonth();
                $label = 'الشهر الحالي مقارنة بالشهر السابق';
                break;

            case 'all':
                $start = null;
                $end = null;
                $prevStart = null;
                $prevEnd = null;
                $label = 'كافة الفترات منذ إطلاق المتجر';
                break;

            case '30d':
            default:
                $start = Carbon::today()->subDays(29);
                $end = Carbon::today()->endOfDay();
                $prevStart = Carbon::today()->subDays(59);
                $prevEnd = Carbon::today()->subDays(30)->endOfDay();
                $label = 'آخر 30 يوماً مقارنة بالفترة السابقة';
                break;
        }

        return [$start, $end, $prevStart, $prevEnd, $label];
    }

    /**
     * Compute safe percentage change between old and new numerical values.
     */
    protected function calculatePercentageChange(float $previous, float $current): float
    {
        if ($previous == 0.0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }
}
