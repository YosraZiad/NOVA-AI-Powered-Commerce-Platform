import React, { useState } from 'react';
import { 
    X, ShoppingBag, Trash2, Plus, Minus, 
    CheckCircle2, CreditCard, Sparkles, Package 
} from 'lucide-react';

export default function CartDrawer({ 
    isOpen, 
    onClose, 
    cart, 
    updateCartQty, 
    removeFromCart, 
    clearCart,
    currentTenant,
    onOpenCheckout 
}) {
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    if (!isOpen) return null;

    const currencySymbol = currentTenant?.currency || 'SAR';
    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);

    const handleCheckout = () => {
        if (onOpenCheckout) {
            onClose();
            onOpenCheckout();
        } else {
            setIsCheckingOut(true);
            setTimeout(() => {
                setIsCheckingOut(false);
                setOrderSuccess(true);
                clearCart();
            }, 1100);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="fixed inset-y-0 left-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md bg-white border-r border-slate-200 shadow-2xl flex flex-col text-slate-800 animate-in slide-in-from-left duration-200">
                    
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm text-slate-900">سلة المشتريات</h3>
                                <p className="text-[11px] text-slate-500">{cart.length} منتجات مضافة</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                        {orderSuccess ? (
                            <div className="text-center py-16 space-y-4">
                                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                                    <CheckCircle2 className="w-9 h-9" />
                                </div>
                                <h4 className="text-lg font-black text-slate-900">تم تسجيل الطلب التجريبي بنجاح!</h4>
                                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                                    شكراً لتسوقك من <span className="font-bold text-slate-800">{currentTenant?.name || 'نوفا'}</span>. تم تسجيل الطلب في سياق المتجر المعزول.
                                </p>
                                <button
                                    onClick={() => {
                                        setOrderSuccess(false);
                                        onClose();
                                    }}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
                                >
                                    متابعة التصفح
                                </button>
                            </div>
                        ) : cart.length === 0 ? (
                            <div className="text-center py-20 space-y-3">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                                    <ShoppingBag className="w-7 h-7" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800">السلة فارغة حالياً</h4>
                                <p className="text-xs text-slate-500">اختر من المنتجات المعروضة في المتجر لإضافتها هنا</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 hover:border-slate-300 transition"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center text-emerald-600 shrink-0">
                                        {item.image_url || item.images?.[0]?.url ? (
                                            <img
                                                src={item.image_url || item.images?.[0]?.url}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    if (e.currentTarget.nextElementSibling) {
                                                        e.currentTarget.nextElementSibling.style.display = 'flex';
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            style={{ display: (item.image_url || item.images?.[0]?.url) ? 'none' : 'flex' }}
                                            className="w-full h-full items-center justify-center"
                                        >
                                            <Package className="w-6 h-6" />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-xs text-slate-900 truncate mb-0.5">{item.name}</h5>
                                        <div className="text-xs font-black text-slate-900 tabular-nums mb-2">
                                            {parseFloat(item.price).toFixed(2)} {currencySymbol}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                                                <button
                                                    onClick={() => updateCartQty(item.id, Math.max(1, item.qty - 1))}
                                                    className="p-1 text-slate-500 hover:text-slate-900"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-6 text-center text-xs font-bold text-slate-900 tabular-nums">
                                                    {item.qty}
                                                </span>
                                                <button
                                                    onClick={() => updateCartQty(item.id, item.qty + 1)}
                                                    className="p-1 text-slate-500 hover:text-slate-900"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition mr-auto"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {cart.length > 0 && !orderSuccess && (
                        <div className="p-5 border-t border-slate-100 bg-slate-50/80 space-y-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-semibold">المجموع الفرعي:</span>
                                <span className="text-lg font-black text-slate-900 tabular-nums">
                                    {subtotal.toFixed(2)} {currencySymbol}
                                </span>
                            </div>

                            <p className="text-[11px] text-slate-500 leading-normal">
                                الأسعار شاملة ضريبة القيمة المضافة 15% المعمول بها في المملكة العربية السعودية.
                            </p>

                            <button
                                onClick={handleCheckout}
                                disabled={isCheckingOut}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-700/20 transition disabled:opacity-50"
                            >
                                {isCheckingOut ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>جاري معالجة الطلب...</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4" />
                                        <span>إتمام الشراء السريع (مدى / بطاقة)</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
