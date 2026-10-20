<?php

namespace App\Http\Requests\Api\V1\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTenantSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['Merchant', 'Platform Admin']);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'logo' => ['nullable', 'string', 'max:500'],
            'currency' => ['sometimes', 'required', 'string', 'in:SAR,AED,KWD,QAR,BHD,OMR,USD'],
            'settings' => ['nullable', 'array'],
            'settings.contact_email' => ['nullable', 'email', 'max:150'],
            'settings.contact_phone' => ['nullable', 'string', 'max:50'],
            'settings.contact_address' => ['nullable', 'string', 'max:255'],
            'settings.low_stock_threshold' => ['nullable', 'integer', 'min:1', 'max:100'],
            'settings.shipping_policy' => ['nullable', 'string', 'max:2000'],
            'settings.return_policy' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'اسم المتجر مطلوب.',
            'currency.in' => 'العملة المحددة غير مدعومة.',
            'settings.contact_email.email' => 'البريد الإلكتروني للتواصل غير صالح.',
            'settings.low_stock_threshold.min' => 'حد التنبيه للمخزون يجب أن يكون 1 على الأقل.',
        ];
    }
}
