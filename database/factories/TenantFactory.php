<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Tenant>
 */
class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->company();

        return [
            'name' => $name,
            'slug' => Str::slug($name) . '-' . fake()->unique()->numberBetween(100, 99999),
            'logo' => null,
            'description' => fake()->sentence(),
            'currency' => 'USD',
            'status' => 'active',
            'settings' => [
                'theme' => 'default',
                'timezone' => 'UTC',
            ],
        ];
    }
}
