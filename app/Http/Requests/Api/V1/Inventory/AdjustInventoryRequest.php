<?php

namespace App\Http\Requests\Api\V1\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class AdjustInventoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('inventory.update') 
            || $this->user()?->hasAnyRole(['Merchant', 'Staff', 'Platform Admin']);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'adjustment_type' => ['required', 'string', 'in:set,add,subtract'],
            'quantity' => ['required', 'integer', 'min:0'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'adjustment_type.required' => 'نوع التعديل مطلوب (تحديد، إضافة، أو خصم).',
            'adjustment_type.in' => 'نوع التعديل غير صالح.',
            'quantity.required' => 'الكمية مطلوبة.',
            'quantity.integer' => 'الكمية يجب أن تكون عدداً صحيحاً.',
            'quantity.min' => 'الكمية لا يمكن أن تكون سالبة.',
        ];
    }
}
