import React from 'react';
import { 
    User, Mail, Phone, ShoppingBag, Clock, 
    ShieldCheck, LogOut, ArrowRight, Store, 
    MapPin, PackageCheck, CheckCircle2 
} from 'lucide-react';

export default function CustomerAccount({
    currentUser,
    currentTenant,
    cart,
    onLogout,
    onNavigate,
    setIsCartOpen,
    setIsAuthModalOpen,
    apiCall
}) {
    const [orders, setOrders] = React.useState(() => {
        try {
            return JSON.parse(localStorage.getItem('nova_customer_orders')) || [];
        } catch {
            return [];
        }
    });
    const [loadingOrders, setLoadingOrders] = React.useState(false);

    // Fetch real authenticated customer orders from API
    React.useEffect(() => {
        if (!currentUser || !apiCall) return;

        const fetchCustomerOrders = async () => {
            setLoadingOrders(true);
            try {
                const res = await apiCall('/api/v1/account/orders');
                if (res.status === 200 && res.data?.data) {
                    // If server has orders, update list
                    if (res.data.data.length > 0) {
                        setOrders(res.data.data);
                    }
                }
            } catch (err) {
                console.error('Failed to load customer orders from API:', err);
            } finally {
                setLoadingOrders(false);
            }
        };

        fetchCustomerOrders();
    }, [currentUser]);

    const currency = currentTenant?.currency || 'SAR';
    const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartSubtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 font-sans antialiased text-slate-900">
                <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-5 shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 mx-auto flex items-center justify-center font-bold">
                        <User className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-black text-slate-900">تسجيل الدخول مطلوب</h2>
                        <p className="text-xs text-slate-500">
                            يرجى تسجيل الدخول أو إنشاء حساب جديد للوصول إلى بياناتك وسلة مشترياتك وسجل الطلبات.
                        </p>
                    </div>
                    <div className="pt-2 flex flex-col gap-2.5">
                        <button
                            onClick={() => setIsAuthModalOpen?.(true)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                        >
                            تسجيل الدخول / إنشاء حساب
                        </button>
                        <button
                            onClick={() => onNavigate(`/store/${currentTenant?.slug || 'demo-store'}`)}
                            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                        >
                            العودة للتسوق في المتجر
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
            {/* Shopper Top Navigation */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <button
                        onClick={() => onNavigate(`/store/${currentTenant?.slug || 'demo-store'}`)}
                        className="flex items-center gap-3 text-right group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-lg shadow-xs group-hover:scale-105 transition">
                            <Store className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-black text-base text-slate-900">
                                    {currentTenant?.name || 'متجر نوفا'}
                                </h1>
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full">
                                    حساب العميل
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500">العودة لتصفح المنتجات</p>
                        </div>
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onNavigate(`/store/${currentTenant?.slug || 'demo-store'}`)}
                            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                        >
                            <Store className="w-4 h-4 text-emerald-600" />
                            <span>المتجر</span>
                        </button>

                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                        >
                            <ShoppingBag className="w-4 h-4 text-emerald-600" />
                            <span>السلة ({totalCartItems})</span>
                        </button>

                        <button
                            onClick={onLogout}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="تسجيل الخروج"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8 pb-16">
                    {/* Header */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-black text-2xl shadow-xs">
                                {currentUser?.name ? currentUser.name.charAt(0) : 'C'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                        حساب عميل متسوق
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">ID: #{currentUser?.id || 1}</span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                                    {currentUser?.name || 'العميل'}
                                </h1>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    عضو في متجر <span className="font-semibold text-slate-800">{currentTenant?.name || 'نوفا'}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onNavigate(`/store/${currentTenant?.slug || 'demo-store'}`)}
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
                            >
                                <Store className="w-4 h-4" />
                                <span>التسوق في المتجر</span>
                            </button>
                            <button
                                onClick={onLogout}
                                className="p-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl transition border border-slate-200"
                                title="تسجيل الخروج"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

            {/* Profile & Cart Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Profile Details */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                    <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600" />
                        <span>بيانات الحساب الشخصي</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                            <span className="text-slate-400 font-medium block">الاسم بالكامل:</span>
                            <span className="font-bold text-slate-800 text-sm">{currentUser?.name || '—'}</span>
                        </div>

                        <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                            <span className="text-slate-400 font-medium block">البريد الإلكتروني:</span>
                            <span className="font-bold text-slate-800 text-sm font-mono">{currentUser?.email || '—'}</span>
                        </div>

                        <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                            <span className="text-slate-400 font-medium block">رقم الهاتف:</span>
                            <span className="font-bold text-slate-800 text-sm font-mono">{currentUser?.phone || '+966 50 000 0000'}</span>
                        </div>

                        <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                            <span className="text-slate-400 font-medium block">حالة الحساب:</span>
                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>نشط وموثق</span>
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span>عنوان التوصيل الافتراضي: الرياض، المملكة العربية السعودية</span>
                        </div>
                        <span className="text-emerald-700 font-bold">معتمد</span>
                    </div>
                </div>

                {/* Active Cart Snapshot */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-5">
                    <div>
                        <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-emerald-600" />
                            <span>سلة التسوق النشطة</span>
                        </h3>

                        <div className="py-4 text-center space-y-2">
                            <div className="text-3xl font-black text-slate-900 tabular-nums">
                                {totalCartItems} <span className="text-xs font-normal text-slate-500">منتجات</span>
                            </div>
                            <div className="text-xs text-slate-500">
                                القيمة الإجمالية: <span className="font-bold text-slate-800 tabular-nums">{cartSubtotal.toFixed(2)} {currency}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                    >
                        <span>فتح سلة المشتريات</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>

            </div>

            {/* Orders History Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>سجل الطلبات والمشتريات ({orders.length})</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">سجل الطلبات الموثق</span>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-10 space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <PackageCheck className="w-10 h-10 text-slate-400 mx-auto" />
                        <h4 className="text-xs font-bold text-slate-700">لا توجد طلبات مكتملة سابقة</h4>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                            سجل الطلبات جاهز وسيعرض مشترياتك وتفاصيل الفواتير والشحن فور إتمام أول طلب.
                        </p>
                        <button
                            onClick={() => onNavigate('/store/demo-store')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                        >
                            تصفح المنتجات وابدأ التسوق
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((ord, idx) => {
                            const orderNum = ord.order_number || ord.orderRef || (`#${ord.id}`);
                            const orderDate = ord.created_at ? new Date(ord.created_at).toLocaleDateString('ar-SA') : (ord.date || '—');
                            const tenantName = ord.tenant?.name || ord.tenant || currentTenant?.name || 'متجر نوفا';
                            const orderTotal = ord.financials?.total ?? ord.grandTotal ?? 0;
                            const orderCurrency = ord.financials?.currency || currency;
                            const payMethod = ord.payment?.method || ord.paymentMethod;
                            const city = ord.shipping?.city || ord.customer?.city || 'المملكة العربية السعودية';
                            const address = ord.shipping?.address || ord.customer?.address || '';
                            const items = ord.items || [];

                            return (
                                <div
                                    key={orderNum || idx}
                                    className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3 text-right"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="font-mono font-black text-xs text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                                                {orderNum}
                                            </span>
                                            <span className="text-xs text-slate-500">{orderDate}</span>
                                            <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                                                {tenantName}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {ord.status === 'completed' ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>مكتمل وتم الشحن والتسليم</span>
                                                </span>
                                            ) : ord.status === 'processing' ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                                    <span>قيد التجهيز والشحن</span>
                                                </span>
                                            ) : ord.status === 'cancelled' ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                                                    <span>ملغي</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                                    <span>تم الاستلام — قيد الانتظار</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {items.map((it, i) => {
                                            const itemName = it.product_name || it.name;
                                            const itemQty = it.quantity || it.qty || 1;
                                            const itemPrice = it.unit_price ? parseFloat(it.unit_price) : parseFloat(it.price || 0);
                                            const itemImage = it.product?.image_url || it.image_url || it.images?.[0]?.url;

                                            return (
                                                <div key={i} className="flex items-center justify-between text-xs py-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                                            {itemImage ? (
                                                                <img src={itemImage} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-slate-800">{itemName}</span>
                                                        <span className="text-slate-400 font-mono">× {itemQty}</span>
                                                    </div>
                                                    <span className="font-black text-slate-900 tabular-nums">
                                                        {(itemPrice * itemQty).toFixed(2)} {orderCurrency}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-200/70 text-xs">
                                        <div className="text-slate-500">
                                            التوصيل إلى: <span className="font-bold text-slate-700">{city} {address ? `— ${address}` : ''}</span>
                                            {payMethod && (
                                                <span className="mr-3 font-semibold text-slate-600">
                                                    (طريقة الدفع: {payMethod === 'mada' ? 'مدى / بطاقة' : payMethod === 'apple_pay' ? 'Apple Pay' : 'الدفع عند الاستلام'})
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-slate-900 font-black text-sm">
                                            الإجمالي: <span className="text-emerald-700 tabular-nums">{parseFloat(orderTotal).toFixed(2)} {orderCurrency}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            </div>
            </main>
        </div>
    );
}
