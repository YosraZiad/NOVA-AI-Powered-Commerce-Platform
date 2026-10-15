<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->words(3, true);
        $price = fake()->randomFloat(2, 10, 500);

        return [
            'tenant_id' => Tenant::factory(),
            'category_id' => null,
            'name' => ucfirst($name),
            'slug' => Str::slug($name) . '-' . fake()->unique()->numberBetween(100, 99999),
            'description' => fake()->paragraph(),
            'sku' => 'SKU-' . strtoupper(Str::random(8)),
            'price' => $price,
            'compare_at_price' => fake()->boolean(40) ? $price + 20 : null,
            'stock_quantity' => fake()->numberBetween(0, 100),
            'status' => 'active',
        ];
    }
}
