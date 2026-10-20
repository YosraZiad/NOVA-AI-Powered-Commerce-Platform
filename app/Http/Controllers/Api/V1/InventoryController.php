<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\TenantContextInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Inventory\AdjustInventoryRequest;
use App\Models\Product;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class InventoryController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected TenantContextInterface $tenantContext
    ) {}

    /**
     * Display a listing of inventory for products in the current tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        if (!$tenant) {
            return response()->json(['message' => 'No active tenant in context.'], Response::HTTP_NOT_FOUND);
        }

        $threshold = (int) ($tenant->settings['low_stock_threshold'] ?? 5);

        // Product model is scoped automatically by BelongsToTenant
        $query = Product::with(['category', 'variants'])->latest();

        // Search by name or SKU
        if ($request->filled('search')) {
            $term = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                  ->orWhere('sku', 'like', $term);
            });
        }

        // Filter by stock level status
        if ($request->input('stock_status') === 'out_of_stock') {
            $query->where('stock_quantity', '<=', 0);
        } elseif ($request->input('stock_status') === 'low_stock') {
            $query->where('stock_quantity', '>', 0)
                  ->where('stock_quantity', '<=', $threshold);
        } elseif ($request->input('stock_status') === 'in_stock') {
            $query->where('stock_quantity', '>', $threshold);
        }

        $products = $query->paginate(20);

        return response()->json([
            'data' => $products->items(),
            'meta' => [
                'total' => $products->total(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'low_stock_threshold' => $threshold,
            ],
        ]);
    }

    /**
     * Safely adjust product inventory with validation and atomic lock.
     */
    public function adjust(AdjustInventoryRequest $request, Product $product): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        // Verify product belongs to active tenant
        if ($product->tenant_id !== $tenant->id) {
            abort(Response::HTTP_NOT_FOUND, 'Product not found in this tenant.');
        }

        $type = $request->input('adjustment_type'); // 'set', 'add', 'subtract'
        $qty = (int) $request->input('quantity');
        $reason = $request->input('reason', 'manual_adjustment');

        $updatedProduct = DB::transaction(function () use ($product, $type, $qty) {
            /** @var Product $lockedProduct */
            $lockedProduct = Product::lockForUpdate()->findOrFail($product->id);

            $currentStock = $lockedProduct->stock_quantity;
            $newStock = match ($type) {
                'set' => $qty,
                'add' => $currentStock + $qty,
                'subtract' => $currentStock - $qty,
            };

            // Protection against negative stock
            if ($newStock < 0) {
                abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Cannot adjust stock below zero. Current stock is ' . $currentStock . '.');
            }

            $lockedProduct->stock_quantity = $newStock;
            $lockedProduct->save();

            return $lockedProduct;
        });

        return response()->json([
            'message' => 'Inventory adjusted successfully.',
            'product' => [
                'id' => $updatedProduct->id,
                'name' => $updatedProduct->name,
                'sku' => $updatedProduct->sku,
                'stock_quantity' => $updatedProduct->stock_quantity,
            ],
            'adjustment' => [
                'type' => $type,
                'quantity' => $qty,
                'new_stock' => $updatedProduct->stock_quantity,
                'reason' => $reason,
            ],
        ], Response::HTTP_OK);
    }
}
