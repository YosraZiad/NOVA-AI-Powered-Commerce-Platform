import React, { useState } from 'react';
import { 
    X, CheckCircle2, ShieldCheck, Truck, CreditCard, 
    MapPin, User, Phone, Mail, ArrowRight, Lock, 
    Sparkles, AlertCircle, ShoppingBag, Banknote 
} from 'lucide-react';

export default function CheckoutModal({
    isOpen,
    onClose,
    cart,
    clearCart,
    currentTenant,
    currentUser,
    showToast,
    apiCall
}) {
    const [step, setStep] = useState(1); // 1: Shipping & Customer, 2: Payment, 3: Success
    const [name, setName] = useState(currentUser?.name || '');
    const [phone, setPhone] = useState(currentUser?.phone || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [city, setCity] = useState('الرياض');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('mada'); // 'mada' | 'apple_pay' | 'cod'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completedOrder, setCompletedOrder] = useState(null);

    if (!isOpen) return null;

    const currency = currentTenant?.currency || 'SAR';
    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
    const shippingFee = subtotal >= 200 ? 0 : 25;
    const grandTotal = subtotal + shippingFee;

    const saudiCities = [
        'الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 
        'الخبر', 'الظهران', 'الأحساء', 'بريدة', 'تبوك', 'خميس مشيط', 'أبها', 'الطائف'
    ];

    const handleContinueToPayment = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            showToast?.('يرجى إدخال اسم المستلم', 'error');
            return;
        }
        if (!phone.trim()) {
            showToast?.('يرجى إدخال رقم الجوال للتواصل', 'error');
            return;
        }
        if (!address.trim()) {
            showToast?.('يرجى كتابة عنوان التوصيل الحي والشارع', 'error');
            return;
        }
        setStep(2);
    };

    const handleConfirmOrder = async () => {
        if (!cart || cart.length === 0) {
            showToast?.('سلة المشتريات فارغة!', 'error');
            return;
        }

        setIsSubmitting(true);

        const slug = currentTenant?.slug || 'demo-store';
        const payload = {
            customer_name: name.trim(),
            customer_phone: phone.trim(),
            customer_email: email.trim() ? email.trim() : null,
            shipping_city: city,
            shipping_address: address.trim(),
            shipping_notes: notes.trim() ? notes.trim() : null,
            payment_method: paymentMethod,
            items: cart.map(item => ({
                product_id: item.id,
                quantity: item.qty,
                variant_id: item.variant_id || null,
            })),
            notes: notes.trim() ? notes.trim() : null,
        };

        try {
            const res = apiCall
                ? await apiCall(`/api/v1/storefront/${slug}/checkout`, {
                    method: 'POST',
                    body: payload
                })
                : await fetch(`/api/v1/storefront/${slug}/checkout`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                }).then(r => r.json().then(data => ({ status: r.status, data })));

            if (res.status === 201 || res.status === 200) {
                const orderData = res.data?.data;
                const formattedOrder = {
                    id: orderData?.id,
                    orderRef: orderData?.order_number || ('NOVA-' + (orderData?.id || Math.floor(100000 + Math.random() * 900000))),
                    date: new Date().toLocaleDateString('ar-SA'),
                    customer: {
                        name: orderData?.customer?.name || name,
                        phone: orderData?.customer?.phone || phone,
                        email: orderData?.customer?.email || email,
                        city: orderData?.shipping?.city || city,
                        address: orderData?.shipping?.address || address,
                        notes: orderData?.shipping?.notes || notes
                    },
                    items: orderData?.items?.length ? orderData.items : [...cart],
                    subtotal: orderData?.financials?.subtotal ?? subtotal,
                    shippingFee: orderData?.financials?.shipping_fee ?? shippingFee,
                    grandTotal: orderData?.financials?.total ?? grandTotal,
                    paymentMethod: orderData?.payment?.method || paymentMethod,
                    tenant: orderData?.tenant?.name || currentTenant?.name || 'متجر نوفا'
                };

                // Save order to local storage for customer account offline fallback
                try {
                    const existingOrders = JSON.parse(localStorage.getItem('nova_customer_orders')) || [];
                    localStorage.setItem('nova_customer_orders', JSON.stringify([formattedOrder, ...existingOrders]));
                } catch (e) {
                    console.error(e);
                }

                setCompletedOrder(formattedOrder);
                clearCart?.();
                setStep(3);
                showToast?.('تم تأكيد طلبك بنجاح!', 'success');
            } else {
                const errMsg = res.data?.errors
                    ? Object.values(res.data.errors).flat().join(' | ')
                    : (res.data?.message || 'فشل إتمام الطلب، يرجى التأكد من توفر المخزون.');
                showToast?.(errMsg, 'error', 'خطأ في الطلب');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            showToast?.('حدث خطأ في الاتصال بالخادم، يرجى المحاولة مرة أخرى.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (step === 3) {
            setStep(1);
            setCompletedOrder(null);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div 
                className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-base text-slate-900">
                                {step === 3 ? 'تم تأكيد الطلب بنجاح' : 'إتمام الطلب والشحن الآمن'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                متجر: <span className="font-semibold text-slate-700">{currentTenant?.name || 'نوفا'}</span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Stepper Progress Bar (Only for steps 1 and 2) */}
                {step !== 3 && (
                    <div className="bg-white px-6 py-3 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 shrink-0">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-700' : ''}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                1
                            </span>
                            <span>بيانات التوصيل والمستلم</span>
                        </div>
                        <div className="h-0.5 w-12 bg-slate-200" />
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-700' : ''}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                2
                            </span>
                            <span>طريقة الدفع وتأكيد الطلب</span>
                        </div>
                    </div>
                )}

                {/* Body Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                    
                    {/* STEP 1: Shipping and Customer Information */}
                    {step === 1 && (
                        <form onSubmit={handleContinueToPayment} className="space-y-5">
                            {/* Notice */}
                            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
                                <Truck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-bold text-emerald-900 text-xs mb-0.5">شحن وتوصيل فوري مباشر</div>
                                    <div className="text-[11px] text-emerald-700 leading-relaxed">
                                        يتم شحن طلبك عبر أسطول التوصيل المعتمد لجميع مدن ومحافظات المملكة العربية السعودية ودول الخليج.
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-black text-sm text-slate-900">بيانات المستلم:</h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="font-bold text-slate-700">الاسم الثلاثي للمستلم *</label>
                                        <div className="relative">
                                            <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="مثال: فيصل بن عبدالعزيز"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="font-bold text-slate-700">رقم الجوال للتواصل *</label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="tel"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="05XXXXXXXX"
                                                dir="ltr"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 font-mono text-left focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-700">البريد الإلكتروني (لتأكيد الفاتورة)</label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="customer@example.com"
                                            dir="ltr"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 font-mono text-left focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 border-t border-slate-100">
                                <h4 className="font-black text-sm text-slate-900">عنوان التوصيل في المملكة:</h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="font-bold text-slate-700">المدينة *</label>
                                        <select
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                                        >
                                            {saudiCities.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="font-bold text-slate-700">الحي والشارع ورقم المبنى *</label>
                                        <div className="relative">
                                            <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                required
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="مثال: حي النرجس، شارع أنس بن مالك"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-700">ملاحظات التوصيل لمندوب الشحن (اختياري)</label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="مثال: يرجى الاتصال قبل الوصول بنصف ساعة"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                                <div className="text-slate-500 text-xs">
                                    المجموع: <span className="font-black text-slate-900 text-sm tabular-nums">{grandTotal.toFixed(2)} {currency}</span>
                                </div>

                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-xs"
                                >
                                    <span>المتابعة إلى الدفع والمراجعة</span>
                                    <ArrowRight className="w-4 h-4 rotate-180" />
                                </button>
                            </div>
                        </form>
                    )}

                    {/* STEP 2: Payment & Final Review */}
                    {step === 2 && (
                        <div className="space-y-6">
                            {/* Order Items Snapshot */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                                <div className="font-bold text-slate-700 text-xs flex items-center justify-between">
                                    <span>ملخص المنتجات في الطلب ({cart.length})</span>
                                    <span className="text-[11px] text-slate-400">التوصيل إلى {city}</span>
                                </div>

                                <div className="divide-y divide-slate-200/60 max-h-48 overflow-y-auto">
                                    {cart.map((item) => (
                                        <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                                    {item.image_url || item.images?.[0]?.url ? (
                                                        <img src={item.image_url || item.images?.[0]?.url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-900 truncate text-xs">{item.name}</div>
                                                    <div className="text-[11px] text-slate-500">{item.qty} × {parseFloat(item.price).toFixed(2)} {currency}</div>
                                                </div>
                                            </div>
                                            <span className="font-black text-slate-900 tabular-nums">
                                                {(parseFloat(item.price) * item.qty).toFixed(2)} {currency}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
                                    <div className="flex justify-between text-slate-500">
                                        <span>المجموع الفرعي:</span>
                                        <span className="font-bold text-slate-800 tabular-nums">{subtotal.toFixed(2)} {currency}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>رسوم الشحن والتوصيل:</span>
                                        {shippingFee === 0 ? (
                                            <span className="font-bold text-emerald-600">مجاناً (عرض ترويجي)</span>
                                        ) : (
                                            <span className="font-bold text-slate-800 tabular-nums">{shippingFee.toFixed(2)} {currency}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200/70">
                                        <span>الإجمالي النهائي شامل الضريبة 15%:</span>
                                        <span className="text-emerald-700 tabular-nums">{grandTotal.toFixed(2)} {currency}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Options Selection */}
                            <div className="space-y-3">
                                <h4 className="font-black text-sm text-slate-900">اختر طريقة الدفع المفضلة:</h4>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Mada / Card */}
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('mada')}
                                        className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between space-y-2 ${
                                            paymentMethod === 'mada'
                                                ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <CreditCard className="w-5 h-5 text-emerald-600" />
                                            {paymentMethod === 'mada' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                        </div>
                                        <div>
                                            <div className="font-black text-xs">مدى / فيزا / ماستركارد</div>
                                            <div className="text-[10px] text-slate-500">بطاقات الدفع البنكية السعودية</div>
                                        </div>
                                    </button>

                                    {/* Apple Pay */}
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('apple_pay')}
                                        className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between space-y-2 ${
                                            paymentMethod === 'apple_pay'
                                                ? 'bg-slate-900 border-slate-900 text-white ring-2 ring-slate-900/20'
                                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-sm"> Pay</span>
                                            {paymentMethod === 'apple_pay' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                        </div>
                                        <div>
                                            <div className="font-black text-xs">Apple Pay</div>
                                            <div className="text-[10px] opacity-75">دفع سريع بضغطة زر واحدة</div>
                                        </div>
                                    </button>

                                    {/* Cash on Delivery */}
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('cod')}
                                        className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between space-y-2 ${
                                            paymentMethod === 'cod'
                                                ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <Banknote className="w-5 h-5 text-emerald-600" />
                                            {paymentMethod === 'cod' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                        </div>
                                        <div>
                                            <div className="font-black text-xs">الدفع عند الاستلام</div>
                                            <div className="text-[10px] text-slate-500">سداد القيمة لمندوب التوصيل</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Bottom Actions */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-xs font-bold transition"
                                >
                                    رجوع للعنوان
                                </button>

                                <button
                                    type="button"
                                    onClick={handleConfirmOrder}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-sm shadow-emerald-700/20"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>جاري معالجة وتأكيد الطلب...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            <span>تأكيد الطلب الآن ({grandTotal.toFixed(2)} {currency})</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Order Confirmation & Receipt */}
                    {step === 3 && completedOrder && (
                        <div className="py-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                                <CheckCircle2 className="w-9 h-9" />
                            </div>

                            <div className="space-y-1.5">
                                <h4 className="text-xl font-black text-slate-900">تم تسجيل وتأكيد طلبك بنجاح!</h4>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                                    شكراً لتسوقك من <span className="font-bold text-slate-800">{completedOrder.tenant}</span>. تم استلام تفاصيل طلبك وسيتواصل معك فريق الشحن قريباً.
                                </p>
                            </div>

                            {/* Receipt Summary Card */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-right space-y-3 font-mono text-xs max-w-md mx-auto">
                                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                                    <span className="text-slate-500 font-sans">رقم الطلب المرجعي:</span>
                                    <span className="font-bold text-slate-900">{completedOrder.orderRef}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                                    <span className="text-slate-500 font-sans">تاريخ الطلب:</span>
                                    <span className="text-slate-700">{completedOrder.date}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                                    <span className="text-slate-500 font-sans">المستلم والمدينة:</span>
                                    <span className="text-slate-800 font-sans font-bold">{completedOrder.customer.name} — {completedOrder.customer.city}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                                    <span className="text-slate-500 font-sans">طريقة الدفع المعتمدة:</span>
                                    <span className="text-emerald-700 font-sans font-bold">
                                        {completedOrder.paymentMethod === 'mada' && 'مدى / بطاقة ائتمانية'}
                                        {completedOrder.paymentMethod === 'apple_pay' && 'Apple Pay'}
                                        {completedOrder.paymentMethod === 'cod' && 'الدفع عند الاستلام'}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-1 text-sm font-sans font-black text-slate-900">
                                    <span>المبلغ الإجمالي المدفوع:</span>
                                    <span className="text-emerald-700 tabular-nums">{completedOrder.grandTotal.toFixed(2)} {currency}</span>
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-center gap-3">
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition shadow-xs"
                                >
                                    العودة للتسوق في المتجر
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
