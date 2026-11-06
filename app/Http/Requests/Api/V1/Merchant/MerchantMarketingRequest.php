<?php

namespace App\Http\Requests\Api\V1\Merchant;

use Illuminate\Foundation\Http\FormRequest;

class MerchantMarketingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'theme' => ['nullable', 'string', 'max:100'],
            'goal' => ['nullable', 'string', 'max:200'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['integer'],
            'target_audience' => ['nullable', 'string', 'max:200'],
        ];
    }
}
