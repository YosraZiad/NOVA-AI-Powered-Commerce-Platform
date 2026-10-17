<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Order\UpdateOrderStatusRequest;
use App\Http\Requests\Api\V1\Order\UpdatePaymentStatusRequest;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\Order;
use App\Services\Order\OrderManagementService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of orders for the current tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Order::class);

        // Model automatically scoped by BelongsToTenant global scope
        $query = Order::with(['items.product'])->latest();

        // Filter by order status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by payment status
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->input('payment_status'));
        }

        // Search by order number, customer name, or phone
        if ($request->filled('search')) {
            $term = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($term) {
                $q->where('order_number', 'like', $term)
                  ->orWhere('customer_name', 'like', $term)
                  ->orWhere('customer_phone', 'like', $term);
            });
        }

        $orders = $query->paginate(20);

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
     * Display the specified order with line items.
     */
    public function show(Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        $order->load(['items.product', 'items.variant', 'user', 'tenant']);

        return response()->json([
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * Update order status (pending, processing, completed, cancelled).
     */
    public function updateStatus(
        UpdateOrderStatusRequest $request,
        Order $order,
        OrderManagementService $service
    ): JsonResponse {
        $this->authorize('update', $order);

        $updatedOrder = $service->updateStatus($order, $request->input('status'));

        return response()->json([
            'message' => 'Order status updated successfully.',
            'data' => new OrderResource($updatedOrder),
        ]);
    }

    /**
     * Update order payment status (pending, paid, failed, refunded).
     */
    public function updatePaymentStatus(
        UpdatePaymentStatusRequest $request,
        Order $order,
        OrderManagementService $service
    ): JsonResponse {
        $this->authorize('update', $order);

        $updatedOrder = $service->updatePaymentStatus($order, $request->input('payment_status'));

        return response()->json([
            'message' => 'Payment status updated successfully.',
            'data' => new OrderResource($updatedOrder),
        ]);
    }
}
