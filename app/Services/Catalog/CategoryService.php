<?php

namespace App\Services\Catalog;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CategoryService
{
    /**
     * List all categories for the current tenant.
     *
     * @return Collection<int, Category>
     */
    public function list(): Collection
    {
        return Category::withCount('products')->orderBy('name')->get();
    }

    /**
     * Create a new category for the current tenant.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Category
    {
        if (empty($data['slug']) && !empty($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        return Category::create([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    /**
     * Update an existing category.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Category $category, array $data): Category
    {
        if (isset($data['name']) && empty($data['slug']) && empty($category->slug)) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category->update($data);

        return $category->fresh();
    }

    /**
     * Safely delete a category.
     * Prevents deletion if products are currently associated with the category.
     *
     * @throws ValidationException
     */
    public function delete(Category $category): void
    {
        if ($category->products()->exists()) {
            throw ValidationException::withMessages([
                'category' => ['Cannot delete category that is currently associated with products.'],
            ]);
        }

        $category->delete();
    }
}
