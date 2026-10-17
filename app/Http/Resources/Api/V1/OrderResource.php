<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'customer' => [
                'name' => $this->customer_name,
                'email' => $this->customer_email,
                'phone' => $this->customer_phone,
            ],
            'shipping' => [
                'city' => $this->shipping_city,
                'address' => $this->shipping_address,
                'notes' => $this->shipping_notes,
            ],
            'payment' => [
                'method' => $this->payment_method,
                'status' => $this->payment_status,
            ],
            'financials' => [
                'subtotal' => (float) $this->subtotal,
                'tax_amount' => (float) $this->tax_amount,
                'shipping_fee' => (float) $this->shipping_fee,
                'discount_amount' => (float) $this->discount_amount,
                'total' => (float) $this->total,
                'currency' => $this->currency,
            ],
            'notes' => $this->notes,
            'items_count' => $this->whenCounted('items', $this->items_count),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'tenant' => new TenantResource($this->whenLoaded('tenant')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
