<?php

namespace App\Services\Catalog;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductService
{
    /**
     * List products with search, filtering, sorting, and pagination.
     *
     * @param  array<string, mixed>  $filters
     */
    public function list(array $filters): LengthAwarePaginator
    {
        $query = Product::query()->with(['category', 'images', 'variants']);

        // Search in name, sku, and description
        if (!empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                  ->orWhere('sku', 'like', $term)
                  ->orWhere('description', 'like', $term);
            });
        }

        // Filter by category
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // Filter by minimum price
        if (isset($filters['min_price']) && is_numeric($filters['min_price'])) {
            $query->where('price', '>=', (float) $filters['min_price']);
        }

        // Filter by maximum price
        if (isset($filters['max_price']) && is_numeric($filters['max_price'])) {
            $query->where('price', '<=', (float) $filters['max_price']);
        }

        // Filter by status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Safe sorting with strict allowlist
        $allowedSortColumns = ['name', 'price', 'stock_quantity', 'sku', 'created_at'];
        $sortBy = in_array($filters['sort_by'] ?? null, $allowedSortColumns, true)
            ? $filters['sort_by']
            : 'created_at';

        $sortDirection = strtolower($filters['sort_direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDirection);

        // Sensible pagination bounds
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        return $query->paginate($perPage);
    }

    /**
     * Create a new product for the current tenant.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['slug']) && !empty($data['name'])) {
                $data['slug'] = Str::slug($data['name']);
            }

            return Product::create([
                'category_id' => $data['category_id'] ?? null,
                'name' => $data['name'],
                'slug' => $data['slug'],
                'description' => $data['description'] ?? null,
                'sku' => $data['sku'],
                'price' => $data['price'],
                'compare_at_price' => $data['compare_at_price'] ?? null,
                'stock_quantity' => $data['stock_quantity'] ?? 0,
                'status' => $data['status'] ?? 'draft',
            ]);
        });
    }

    /**
     * Update an existing product.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            $product->update($data);

            return $product->fresh(['category', 'images', 'variants']);
        });
    }

    /**
     * Soft delete a product.
     */
    public function delete(Product $product): void
    {
        $product->delete();
    }
}
