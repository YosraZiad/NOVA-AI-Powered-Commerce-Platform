<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Contracts\TenantContextInterface;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('products.create') ?? false;
    }

    public function rules(): array
    {
        $tenantId = app(TenantContextInterface::class)->id();

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'description' => ['nullable', 'string'],
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'price' => ['required', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0', 'gte:price'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'string', 'in:draft,active,archived'],
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
            'compare_at_price.gte' => 'The compare at price must be greater than or equal to the price.',
        ];
    }
}
