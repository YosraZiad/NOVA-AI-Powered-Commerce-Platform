<?php

namespace App\Services\Catalog;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ProductImageService
{
    /**
     * List images for a product.
     *
     * @return Collection<int, ProductImage>
     */
    public function list(Product $product): Collection
    {
        return $product->images()->orderBy('sort_order')->get();
    }

    /**
     * Upload and attach an image to a product.
     */
    public function upload(
        Product $product,
        UploadedFile $file,
        ?string $altText = null,
        ?int $sortOrder = null
    ): ProductImage {
        $storageDir = "tenants/{$product->tenant_id}/products/{$product->id}";
        $path = $file->store($storageDir, 'public');

        if ($sortOrder === null) {
            $maxOrder = $product->images()->max('sort_order') ?? -1;
            $sortOrder = $maxOrder + 1;
        }

        return $product->images()->create([
            'path' => $path,
            'alt_text' => $altText,
            'sort_order' => $sortOrder,
        ]);
    }

    /**
     * Delete an image from a product.
     *
     * @throws NotFoundHttpException
     */
    public function delete(Product $product, ProductImage $image): void
    {
        if ((int) $image->product_id !== (int) $product->id) {
            throw new NotFoundHttpException('Image does not belong to this product.');
        }

        if (Storage::disk('public')->exists($image->path)) {
            Storage::disk('public')->delete($image->path);
        }

        $image->delete();
    }
}
