<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Contracts\TenantContextInterface;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductVariantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('products.update') ?? false;
    }

    public function rules(): array
    {
        $tenantId = app(TenantContextInterface::class)->id();
        $variant = $this->route('variant');
        $variantId = $variant instanceof ProductVariant ? $variant->id : $variant;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'options' => ['nullable', 'array'],
            'sku' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                function ($attribute, $value, $fail) use ($tenantId, $variantId) {
                    $variantExists = ProductVariant::whereHas('product', fn ($q) => $q->where('tenant_id', $tenantId))
                        ->where('sku', $value)
                        ->where('id', '!=', $variantId)
                        ->exists();

                    $productExists = Product::where('tenant_id', $tenantId)
                        ->where('sku', $value)
                        ->exists();

                    if ($variantExists || $productExists) {
                        $fail('The sku has already been taken in this store.');
                    }
                },
            ],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'stock_quantity' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
