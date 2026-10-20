<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\TenantContextInterface;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class MerchantCustomerController extends Controller
{
    public function __construct(
        protected TenantContextInterface $tenantContext
    ) {}

    /**
     * Display a scoped listing of customers who placed orders in the active tenant.
     * Strictly protects privacy: no password hashes, tokens, or system credentials exposed.
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->getTenant();

        if (!$tenant) {
            return response()->json(['message' => 'No active tenant in context.'], Response::HTTP_NOT_FOUND);
        }

        $tenantId = $tenant->id;

        // Group customer records by phone / email for this specific tenant
        $query = Order::where('tenant_id', $tenantId)
            ->select(
                'customer_phone',
                DB::raw('MAX(customer_name) as name'),
                DB::raw('MAX(customer_email) as email'),
                DB::raw('MAX(shipping_city) as city'),
                DB::raw('COUNT(id) as total_orders'),
                DB::raw('SUM(total) as total_spent'),
                DB::raw('MAX(created_at) as last_order_date'),
                DB::raw('MAX(order_number) as last_order_number')
            )
            ->groupBy('customer_phone');

        // Search by name, phone, email, or city
        if ($request->filled('search')) {
            $term = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($term) {
                $q->where('customer_name', 'like', $term)
                  ->orWhere('customer_phone', 'like', $term)
                  ->orWhere('customer_email', 'like', $term)
                  ->orWhere('shipping_city', 'like', $term);
            });
        }

        $customers = $query->paginate(20);

        return response()->json([
            'data' => collect($customers->items())->map(fn ($c) => [
                'name' => $c->name,
                'phone' => $c->customer_phone,
                'email' => $c->email,
                'city' => $c->city,
                'total_orders' => (int) $c->total_orders,
                'total_spent' => (float) $c->total_spent,
                'last_order_date' => $c->last_order_date,
                'last_order_number' => $c->last_order_number,
            ]),
            'meta' => [
                'total' => $customers->total(),
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
            ],
        ]);
    }
}
