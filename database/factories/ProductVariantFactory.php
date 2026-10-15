<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'name' => 'Variant ' . fake()->word(),
            'options' => [
                'size' => fake()->randomElement(['S', 'M', 'L', 'XL']),
                'color' => fake()->safeColorName(),
            ],
            'sku' => 'VAR-' . strtoupper(Str::random(8)),
            'price' => fake()->randomFloat(2, 10, 300),
            'stock_quantity' => fake()->numberBetween(0, 50),
        ];
    }
}
