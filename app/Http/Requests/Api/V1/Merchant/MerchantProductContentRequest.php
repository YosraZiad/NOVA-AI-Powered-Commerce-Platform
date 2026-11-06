<?php

namespace App\Http\Requests\Api\V1\Merchant;

use Illuminate\Foundation\Http\FormRequest;

class MerchantProductContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'max:255'],
            'category_name' => ['nullable', 'string', 'max:150'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'current_description' => ['nullable', 'string', 'max:3000'],
            'key_features' => ['nullable', 'string', 'max:1500'],
            'tone' => ['nullable', 'string', 'in:professional,luxury,marketing,concise,youthful'],
            'target_audience' => ['nullable', 'string', 'max:200'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم المنتج مطلوب لتوليد المحتوى التسويقي.',
            'tone.in' => 'نبرة المحتوى المحددة غير مدعومة.',
        ];
    }
}
