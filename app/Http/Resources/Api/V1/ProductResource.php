<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $firstImage = $this->relationLoaded('images') ? $this->images->first() : null;
        $imageUrl = null;
        if ($firstImage) {
            $imageUrl = filter_var($firstImage->path, FILTER_VALIDATE_URL) || str_starts_with($firstImage->path, '/')
                ? $firstImage->path
                : (str_starts_with($firstImage->path, 'images/') ? '/' . $firstImage->path : \Illuminate\Support\Facades\Storage::disk('public')->url($firstImage->path));
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'sku' => $this->sku,
            'price' => (float) $this->price,
            'compare_at_price' => $this->compare_at_price !== null ? (float) $this->compare_at_price : null,
            'stock_quantity' => (int) $this->stock_quantity,
            'status' => $this->status,
            'category_id' => $this->category_id,
            'image_url' => $imageUrl,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
