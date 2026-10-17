<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Order\CheckoutRequest;
use App\Http\Resources\Api\V1\CategoryResource;
use App\Http\Resources\Api\V1\OrderResource;
use App\Http\Resources\Api\V1\ProductResource;
use App\Http\Resources\Api\V1\TenantResource;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Services\Order\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StorefrontController extends Controller
{
    /**
     * Resolve active tenant by slug or fail with 404.
     */
    protected function getActiveTenant(string $slug): Tenant
    {
        $tenant = Tenant::where('slug', $slug)
            ->where('status', 'active')
            ->first();

        // In standalone mode, fallback to the single local store
        if (!$tenant && config('nova.deployment_mode') === 'standalone') {
            $tenant = Tenant::where('status', 'active')->first();
        }

        if (!$tenant) {
            abort(Response::HTTP_NOT_FOUND, 'Storefront not found or currently unavailable.');
        }

        return $tenant;
    }

    /**
     * Get storefront profile & branding for the active tenant.
     */
    public function info(string $tenant_slug): JsonResponse
    {
        $tenant = $this->getActiveTenant($tenant_slug);

        return response()->json([
            'tenant' => new TenantResource($tenant),
        ]);
    }

    /**
     * Get storefront public catalog for the active tenant.
     */
    public function products(Request $request, string $tenant_slug): JsonResponse
    {
        $tenant = $this->getActiveTenant($tenant_slug);

        $query = Product::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->with(['category', 'images', 'variants']);

        // Search filter
        if ($request->filled('search')) {
            $term = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                  ->orWhere('sku', 'like', $term)
                  ->orWhere('description', 'like', $term);
            });
        }

        // Category filter
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        // Sorting
        $sortBy = in_array($request->input('sort_by'), ['name', 'price', 'created_at'], true)
            ? $request->input('sort_by')
            : 'created_at';
        $direction = strtolower($request->input('sort_direction')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $direction);

        $products = $query->paginate(20);

        return response()->json([
            'data' => ProductResource::collection($products)->response()->getData(true)['data'],
            'meta' => [
                'total' => $products->total(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
            ],
            'tenant' => new TenantResource($tenant),
        ]);
    }

    /**
     * Get active categories for the storefront tenant.
     */
    public function categories(string $tenant_slug): JsonResponse
    {
        $tenant = $this->getActiveTenant($tenant_slug);

        $categories = Category::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get();

        return response()->json([
            'data' => CategoryResource::collection($categories),
        ]);
    }

    /**
     * Process checkout and place order for the active tenant.
     */
    public function checkout(CheckoutRequest $request, string $tenant_slug, CheckoutService $checkoutService): JsonResponse
    {
        $tenant = $this->getActiveTenant($tenant_slug);
        $userId = auth('sanctum')->id();

        $order = $checkoutService->placeOrder($tenant, $request->validated(), $userId);

        return response()->json([
            'message' => 'Order placed successfully.',
            'data' => new OrderResource($order),
        ], Response::HTTP_CREATED);
    }

    /**
     * Retrieve public order status by order number.
     */
    public function order(string $tenant_slug, string $order_number): JsonResponse
    {
        $tenant = $this->getActiveTenant($tenant_slug);

        $order = Order::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->where('order_number', $order_number)
            ->with(['items.product', 'tenant'])
            ->first();

        if (!$order) {
            abort(Response::HTTP_NOT_FOUND, 'Order not found for this store.');
        }

        return response()->json([
            'data' => new OrderResource($order),
        ]);
    }
}
