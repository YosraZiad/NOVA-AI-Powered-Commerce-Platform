<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'user_id' => null,
            'order_number' => 'NOVA-' . strtoupper(Str::random(6)),
            'status' => 'pending',
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'customer_phone' => '050' . fake()->numerify('#######'),
            'shipping_city' => 'الرياض',
            'shipping_address' => fake()->streetAddress(),
            'shipping_notes' => null,
            'payment_method' => 'mada',
            'payment_status' => 'paid',
            'subtotal' => 200.00,
            'tax_amount' => 30.00,
            'shipping_fee' => 0.00,
            'discount_amount' => 0.00,
            'total' => 200.00,
            'currency' => 'SAR',
            'notes' => null,
        ];
    }
}
