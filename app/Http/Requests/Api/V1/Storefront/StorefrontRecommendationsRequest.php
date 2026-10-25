<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class StorefrontRecommendationsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'product_id' => ['nullable', 'integer'],
            'category_id' => ['nullable', 'integer'],
            'intent' => [
                'nullable',
                'string',
                'in:similar,budget_alternatives,cross_sell,frequently_bought_together,trending,personalized',
            ],
            'limit' => ['nullable', 'integer', 'min:1', 'max:12'],
            'exclude_ids' => ['nullable', 'array'],
            'exclude_ids.*' => ['integer'],
        ];
    }
}
