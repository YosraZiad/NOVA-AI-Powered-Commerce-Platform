<?php

namespace App\Http\Requests\Api\V1\Merchant;

use Illuminate\Foundation\Http\FormRequest;

class MerchantAiChatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'min:2', 'max:1000'],
            'period' => ['nullable', 'string', 'in:today,7d,30d,month,all'],
        ];
    }

    public function messages(): array
    {
        return [
            'message.required' => 'يرجى إدخال استفسارك لمساعد ذكاء الأعمال.',
            'message.max' => 'الحد الأقصى لطول السؤال هو 1000 حرف.',
            'period.in' => 'فترة التحليل المحددة غير صالحة.',
        ];
    }
}
