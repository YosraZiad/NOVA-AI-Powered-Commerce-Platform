<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Contracts\TenantContextInterface;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductVariantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('products.update') ?? false;
    }

    public function rules(): array
    {
        $tenantId = app(TenantContextInterface::class)->id();

        return [
            'name' => ['required', 'string', 'max:255'],
            'options' => ['nullable', 'array'],
            'sku' => [
                'required',
                'string',
                'max:100',
                function ($attribute, $value, $fail) use ($tenantId) {
                    $variantExists = ProductVariant::whereHas('product', fn ($q) => $q->where('tenant_id', $tenantId))
                        ->where('sku', $value)
                        ->exists();

                    $productExists = Product::where('tenant_id', $tenantId)
                        ->where('sku', $value)
                        ->exists();

                    if ($variantExists || $productExists) {
                        $fail('The sku has already been taken in this store.');
                    }
                },
            ],
            'price' => ['required', 'numeric', 'min:0'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
