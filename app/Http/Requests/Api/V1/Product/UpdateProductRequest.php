<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Contracts\TenantContextInterface;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('products.update') ?? false;
    }

    public function rules(): array
    {
        $tenantId = app(TenantContextInterface::class)->id();
        $product = $this->route('product');
        $productId = $product instanceof Product ? $product->id : $product;

        $targetPrice = $this->input('price', $product instanceof Product ? $product->price : null);

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('products', 'slug')
                    ->where(fn ($q) => $q->where('tenant_id', $tenantId))
                    ->ignore($productId),
            ],
            'description' => ['nullable', 'string'],
            'sku' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')
                    ->where(fn ($q) => $q->where('tenant_id', $tenantId))
                    ->ignore($productId),
            ],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'compare_at_price' => [
                'nullable',
                'numeric',
                'min:0',
                function ($attribute, $value, $fail) use ($targetPrice) {
                    if ($value !== null && $targetPrice !== null && (float) $value < (float) $targetPrice) {
                        $fail('The compare at price must be greater than or equal to the price.');
                    }
                },
            ],
            'stock_quantity' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', 'string', 'in:draft,active,archived'],
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.exists' => 'The selected category does not belong to the current store.',
        ];
    }
}
