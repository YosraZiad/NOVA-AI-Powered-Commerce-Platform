<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductImageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $url = $this->path;
        if (!filter_var($this->path, FILTER_VALIDATE_URL)) {
            if (str_starts_with($this->path, '/')) {
                $url = $this->path;
            } elseif (str_starts_with($this->path, 'images/')) {
                $url = '/' . $this->path;
            } else {
                $url = Storage::disk('public')->url($this->path);
            }
        }

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'path' => $this->path,
            'url' => $url,
            'alt_text' => $this->alt_text,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
