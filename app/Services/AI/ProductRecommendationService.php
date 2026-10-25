<?php

namespace App\Services\AI;

use App\Http\Resources\Api\V1\ProductResource;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProductRecommendationService
{
    /**
     * Get context-aware recommendations for a storefront tenant.
     *
     * @param Tenant $tenant
     * @param array{
     *     product_id?: int|null,
     *     category_id?: int|null,
     *     intent?: string|null,
     *     limit?: int|null,
     *     exclude_ids?: array<int>|null
     * } $context
     * @return array{
     *     headline: string,
     *     intent: string,
     *     items: array<int, array{
     *         product: array,
     *         reason: string,
     *         badge: string,
     *         score: float
     *     }>
     * }
     */
    public function getRecommendations(Tenant $tenant, array $context = []): array
    {
        $limit = max(1, min((int) ($context['limit'] ?? 4), 12));
        $productId = isset($context['product_id']) ? (int) $context['product_id'] : null;
        $categoryId = isset($context['category_id']) ? (int) $context['category_id'] : null;
        $intent = $context['intent'] ?? 'similar';
        $excludeIds = array_filter(array_map('intval', (array) ($context['exclude_ids'] ?? [])));

        if ($productId) {
            $excludeIds[] = $productId;
        }

        /** @var Product|null $currentProduct */
        $currentProduct = null;
        if ($productId) {
            $currentProduct = Product::withoutGlobalScope(TenantScope::class)
                ->where('tenant_id', $tenant->id)
                ->where('id', $productId)
                ->first();

            if ($currentProduct && !$categoryId && $currentProduct->category_id) {
                $categoryId = (int) $currentProduct->category_id;
            }
        }

        switch ($intent) {
            case 'budget_alternatives':
                $result = $this->getBudgetAlternatives($tenant, $currentProduct, $categoryId, $excludeIds, $limit);
                break;

            case 'cross_sell':
            case 'frequently_bought_together':
                $result = $this->getCrossSellRecommendations($tenant, $currentProduct, $excludeIds, $limit);
                break;

            case 'trending':
                $result = $this->getTrendingRecommendations($tenant, $excludeIds, $limit);
                break;

            case 'similar':
            default:
                $result = $this->getSimilarRecommendations($tenant, $currentProduct, $categoryId, $excludeIds, $limit);
                break;
        }

        return $result;
    }

    /**
     * Get similar products based on category, attributes, and price proximity.
     */
    protected function getSimilarRecommendations(
        Tenant $tenant,
        ?Product $currentProduct,
        ?int $categoryId,
        array $excludeIds,
        int $limit
    ): array {
        $query = Product::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->whereNotIn('id', $excludeIds)
            ->with(['category', 'images', 'variants']);

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        // Prioritize in-stock items
        $query->orderByRaw('CASE WHEN stock_quantity > 0 THEN 0 ELSE 1 END ASC');

        if ($currentProduct) {
            // Price proximity ordering
            $targetPrice = (float) $currentProduct->price;
            $query->orderByRaw('ABS(price - ?)', [$targetPrice]);
        } else {
            $query->latest();
        }

        $products = $query->take($limit)->get();

        // If not enough products in same category, backfill with active store products
        if ($products->count() < $limit) {
            $needed = $limit - $products->count();
            $alreadyIncluded = array_merge($excludeIds, $products->pluck('id')->all());

            $fallback = Product::withoutGlobalScope(TenantScope::class)
                ->where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->whereNotIn('id', $alreadyIncluded)
                ->with(['category', 'images', 'variants'])
                ->orderByRaw('CASE WHEN stock_quantity > 0 THEN 0 ELSE 1 END ASC')
                ->latest()
                ->take($needed)
                ->get();

            $products = $products->concat($fallback);
        }

        $items = $products->map(function (Product $product, int $idx) use ($currentProduct) {
            $score = round(max(0.70, 0.98 - ($idx * 0.05)), 2);
            $reason = $currentProduct && $product->category_id === $currentProduct->category_id
                ? 'منتج مشابه من نفس التصنيف بمواصفات ممتازة'
                : 'منتج مقترح بعناية يناسب ذوقك واهتمامك';

            return [
                'product' => (new ProductResource($product))->resolve(),
                'reason' => $reason,
                'badge' => 'مشابه وموصى به',
                'score' => $score,
            ];
        })->values()->all();

        return [
            'headline' => 'منتجات مشابهة قد تعجبك',
            'intent' => 'similar',
            'items' => $items,
        ];
    }

    /**
     * Get budget-friendly alternatives with lower prices.
     */
    protected function getBudgetAlternatives(
        Tenant $tenant,
        ?Product $currentProduct,
        ?int $categoryId,
        array $excludeIds,
        int $limit
    ): array {
        $query = Product::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->whereNotIn('id', $excludeIds)
            ->with(['category', 'images', 'variants']);

        if ($currentProduct) {
            $query->where('price', '<', $currentProduct->price);
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        $query->orderByRaw('CASE WHEN stock_quantity > 0 THEN 0 ELSE 1 END ASC')
              ->orderBy('price', 'desc');

        $products = $query->take($limit)->get();

        // Backfill if needed
        if ($products->count() < $limit) {
            $needed = $limit - $products->count();
            $alreadyIncluded = array_merge($excludeIds, $products->pluck('id')->all());

            $fallbackQuery = Product::withoutGlobalScope(TenantScope::class)
                ->where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->whereNotIn('id', $alreadyIncluded)
                ->with(['category', 'images', 'variants']);

            if ($currentProduct) {
                $fallbackQuery->where('price', '<=', $currentProduct->price);
            }

            $fallback = $fallbackQuery->orderBy('price', 'asc')
                ->take($needed)
                ->get();

            $products = $products->concat($fallback);
        }

        $items = $products->map(function (Product $product, int $idx) use ($currentProduct) {
            $diff = $currentProduct ? ((float) $currentProduct->price - (float) $product->price) : 0;
            $reason = $diff > 0
                ? sprintf('خيار اقتصادي يوفر لك %.2f ريال وبجودة متميزة', $diff)
                : 'خيار بديل مميز يناسب الميزانية';

            return [
                'product' => (new ProductResource($product))->resolve(),
                'reason' => $reason,
                'badge' => 'سعر اقتصادي',
                'score' => round(max(0.75, 0.95 - ($idx * 0.04)), 2),
            ];
        })->values()->all();

        return [
            'headline' => 'بدائل اقتصادية مميزة',
            'intent' => 'budget_alternatives',
            'items' => $items,
        ];
    }

    /**
     * Get cross-sell / frequently bought together products.
     */
    protected function getCrossSellRecommendations(
        Tenant $tenant,
        ?Product $currentProduct,
        array $excludeIds,
        int $limit
    ): array {
        $coOrderedIds = collect();

        if ($currentProduct) {
            // Find orders containing currentProduct, then get other products in those orders
            $orderIds = OrderItem::where('product_id', $currentProduct->id)
                ->pluck('order_id')
                ->take(50);

            if ($orderIds->isNotEmpty()) {
                $coOrderedIds = OrderItem::whereIn('order_id', $orderIds)
                    ->where('product_id', '!=', $currentProduct->id)
                    ->groupBy('product_id')
                    ->select('product_id', DB::raw('SUM(quantity) as co_count'))
                    ->orderByDesc('co_count')
                    ->take($limit)
                    ->pluck('product_id');
            }
        }

        $products = collect();

        if ($coOrderedIds->isNotEmpty()) {
            $products = Product::withoutGlobalScope(TenantScope::class)
                ->where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->whereIn('id', $coOrderedIds)
                ->whereNotIn('id', $excludeIds)
                ->with(['category', 'images', 'variants'])
                ->get();
        }

        // Backfill from other categories or active catalog if co-orders are sparse
        if ($products->count() < $limit) {
            $needed = $limit - $products->count();
            $alreadyIncluded = array_merge($excludeIds, $products->pluck('id')->all());

            $query = Product::withoutGlobalScope(TenantScope::class)
                ->where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->whereNotIn('id', $alreadyIncluded)
                ->with(['category', 'images', 'variants']);

            // Pick products from complementary or different categories if current product exists
            if ($currentProduct && $currentProduct->category_id) {
                $query->where('category_id', '!=', $currentProduct->category_id);
            }

            $backfill = $query->orderByRaw('CASE WHEN stock_quantity > 0 THEN 0 ELSE 1 END ASC')
                ->latest()
                ->take($needed)
                ->get();

            // If still empty (e.g. store has only one category), take whatever is left
            if ($backfill->isEmpty()) {
                $backfill = Product::withoutGlobalScope(TenantScope::class)
                    ->where('tenant_id', $tenant->id)
                    ->where('status', 'active')
                    ->whereNotIn('id', $alreadyIncluded)
                    ->with(['category', 'images', 'variants'])
                    ->take($needed)
                    ->get();
            }

            $products = $products->concat($backfill);
        }

        $items = $products->map(function (Product $product, int $idx) {
            return [
                'product' => (new ProductResource($product))->resolve(),
                'reason' => 'مكمل رائع ومثالي لاحتياجاتك اليومية مع هذا المنتج',
                'badge' => 'يكمل طلبك',
                'score' => round(max(0.70, 0.94 - ($idx * 0.05)), 2),
            ];
        })->values()->all();

        return [
            'headline' => 'منتجات مكملة يُنصح بشرائها معاً',
            'intent' => 'cross_sell',
            'items' => $items,
        ];
    }

    /**
     * Get trending / best-selling or newest active products.
     */
    protected function getTrendingRecommendations(
        Tenant $tenant,
        array $excludeIds,
        int $limit
    ): array {
        // Try to fetch top-selling products by order items
        $topOrderedIds = OrderItem::whereHas('order', function ($q) use ($tenant) {
                $q->withoutGlobalScope(TenantScope::class)->where('tenant_id', $tenant->id);
            })
            ->groupBy('product_id')
            ->select('product_id', DB::raw('SUM(quantity) as total_sold'))
            ->orderByDesc('total_sold')
            ->take($limit * 2)
            ->pluck('product_id');

        $products = collect();

        if ($topOrderedIds->isNotEmpty()) {
            $products = Product::withoutGlobalScope(TenantScope::class)
                ->where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->whereIn('id', $topOrderedIds)
                ->whereNotIn('id', $excludeIds)
                ->with(['category', 'images', 'variants'])
                ->take($limit)
                ->get();
        }

        if ($products->count() < $limit) {
            $needed = $limit - $products->count();
            $alreadyIncluded = array_merge($excludeIds, $products->pluck('id')->all());

            $fallback = Product::withoutGlobalScope(TenantScope::class)
                ->where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->whereNotIn('id', $alreadyIncluded)
                ->with(['category', 'images', 'variants'])
                ->orderByRaw('CASE WHEN stock_quantity > 0 THEN 0 ELSE 1 END ASC')
                ->latest()
                ->take($needed)
                ->get();

            $products = $products->concat($fallback);
        }

        $items = $products->map(function (Product $product, int $idx) {
            return [
                'product' => (new ProductResource($product))->resolve(),
                'reason' => 'من المنتجات الأكثر طلباً وإعجاباً لدى المتسوقين',
                'badge' => 'الأكثر طلباً',
                'score' => round(max(0.80, 0.99 - ($idx * 0.04)), 2),
            ];
        })->values()->all();

        return [
            'headline' => 'المنتجات الأكثر رواجاً وإقبالاً',
            'intent' => 'trending',
            'items' => $items,
        ];
    }
}
