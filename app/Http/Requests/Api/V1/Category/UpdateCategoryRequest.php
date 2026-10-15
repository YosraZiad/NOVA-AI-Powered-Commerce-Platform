<?php

namespace App\Http\Requests\Api\V1\Category;

use App\Contracts\TenantContextInterface;
use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('categories.update') ?? false;
    }

    public function rules(): array
    {
        $tenantId = app(TenantContextInterface::class)->id();
        $category = $this->route('category');
        $categoryId = $category instanceof Category ? $category->id : $category;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')
                    ->where(fn ($q) => $q->where('tenant_id', $tenantId))
                    ->ignore($categoryId),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
