<?php

namespace App\Http\Requests\Api\V1\Order;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Storefront checkout is public / accessible to shoppers
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Customer Info
            'customer_name' => ['required', 'string', 'max:150'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'customer_email' => ['nullable', 'email', 'max:150'],

            // Shipping Location in Saudi Arabia / GCC
            'shipping_city' => ['required', 'string', 'max:100'],
            'shipping_address' => ['required', 'string', 'max:500'],
            'shipping_notes' => ['nullable', 'string', 'max:500'],

            // Payment Options
            'payment_method' => ['required', 'string', 'in:mada,apple_pay,credit_card,cod'],

            // Order Cart Items
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000'],
            'items.*.variant_id' => ['nullable', 'integer'],

            // Optional order notes
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Custom validation messages in Arabic and English.
     */
    public function messages(): array
    {
        return [
            'customer_name.required' => 'يرجى إدخال اسم العميل المستلم.',
            'customer_phone.required' => 'يرجى تزويدنا برقم هاتف المستلم للتواصل والتوصيل.',
            'shipping_city.required' => 'يرجى تحديد مدينة التوصيل.',
            'shipping_address.required' => 'يرجى إدخال تفاصيل العنوان والحي والشارع.',
            'payment_method.in' => 'طريقة الدفع المحددة غير مدعومة.',
            'items.required' => 'سلة الشراء فارغة، يرجى إضافة منتج واحد على الأقل.',
            'items.min' => 'سلة الشراء فارغة، يرجى إضافة منتج واحد على الأقل.',
            'items.*.quantity.min' => 'الكمية المطلوبة يجب أن تكون 1 على الأقل.',
        ];
    }
}
