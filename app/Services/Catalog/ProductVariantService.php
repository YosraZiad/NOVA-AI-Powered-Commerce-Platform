<?php

namespace App\Services\Catalog;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ProductVariantService
{
    /**
     * List variants for a product.
     *
     * @return Collection<int, ProductVariant>
     */
    public function list(Product $product): Collection
    {
        return $product->variants()->get();
    }

    /**
     * Create a variant for a product.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(Product $product, array $data): ProductVariant
    {
        return $product->variants()->create([
            'name' => $data['name'],
            'options' => $data['options'] ?? null,
            'sku' => $data['sku'],
            'price' => $data['price'],
            'stock_quantity' => $data['stock_quantity'] ?? 0,
        ]);
    }

    /**
     * Update a variant of a product.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws NotFoundHttpException
     */
    public function update(Product $product, ProductVariant $variant, array $data): ProductVariant
    {
        if ((int) $variant->product_id !== (int) $product->id) {
            throw new NotFoundHttpException('Variant does not belong to this product.');
        }

        $variant->update($data);

        return $variant->fresh();
    }

    /**
     * Delete a variant of a product.
     *
     * @throws NotFoundHttpException
     */
    public function delete(Product $product, ProductVariant $variant): void
    {
        if ((int) $variant->product_id !== (int) $product->id) {
            throw new NotFoundHttpException('Variant does not belong to this product.');
        }

        $variant->delete();
    }
}
