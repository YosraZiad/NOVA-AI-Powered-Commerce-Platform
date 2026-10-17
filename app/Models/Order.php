<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     * Note: tenant_id is omitted from fillable to prevent client injection.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'order_number',
        'status',
        'customer_name',
        'customer_email',
        'customer_phone',
        'shipping_city',
        'shipping_address',
        'shipping_notes',
        'payment_method',
        'payment_status',
        'subtotal',
        'tax_amount',
        'shipping_fee',
        'discount_amount',
        'total',
        'currency',
        'notes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'shipping_fee' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    /**
     * The customer user who placed this order, if authenticated.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The line items belonging to this order.
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
