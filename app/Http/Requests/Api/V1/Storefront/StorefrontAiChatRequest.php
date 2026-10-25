<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class StorefrontAiChatRequest extends FormRequest
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
            'message' => ['required', 'string', 'min:1', 'max:1000'],
            'conversation_uuid' => ['nullable', 'string', 'uuid'],
            'session_id' => ['nullable', 'string', 'max:100'],
            'context' => ['nullable', 'array'],
            'context.current_product_id' => ['nullable', 'integer'],
            'context.current_category_id' => ['nullable', 'integer'],
            'context.cart_items' => ['nullable', 'array'],
            'context.cart_items.*.product_id' => ['nullable', 'integer'],
        ];
    }

    /**
     * Custom messages for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'message.required' => 'يرجى كتابة رسالتك أو استفسارك للمساعد الذكي.',
            'message.max' => 'الرسالة طويلة جداً، الحد الأقصى المسموح به هو 1000 حرف.',
            'conversation_uuid.uuid' => 'معرف المحادثة غير صالح.',
        ];
    }
}
