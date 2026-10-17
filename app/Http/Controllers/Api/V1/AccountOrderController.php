<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\Order;
use App\Models\Scopes\TenantScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AccountOrderController extends Controller
{
    /**
     * List all orders placed by the authenticated customer.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Customer sees all orders across stores they purchased from
        $orders = Order::withoutGlobalScope(TenantScope::class)
            ->where('user_id', $user->id)
            ->with(['items.product', 'tenant'])
            ->latest()
            ->paginate(15);

        return response()->json([
            'data' => OrderResource::collection($orders)->response()->getData(true)['data'],
            'meta' => [
                'total' => $orders->total(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
            ],
        ]);
    }

    /**
     * View single order details for the authenticated customer.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $order = Order::withoutGlobalScope(TenantScope::class)
            ->where('user_id', $user->id)
            ->with(['items.product', 'items.variant', 'tenant'])
            ->find($id);

        if (!$order) {
            abort(Response::HTTP_NOT_FOUND, 'Order not found in your account.');
        }

        return response()->json([
            'data' => new OrderResource($order),
        ]);
    }
}
