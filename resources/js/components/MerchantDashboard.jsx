import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, Package, Layers, Boxes, AlertTriangle, 
    CheckCircle2, ArrowUpRight, ArrowDownRight, Sparkles, 
    Plus, ExternalLink, ShieldCheck, ChevronLeft, Eye, 
    Calendar, RefreshCw, DollarSign, Activity, ShoppingCart,
    Clock, Users, Award, FileText
} from 'lucide-react';

export default function MerchantDashboard({
    currentUser,
    currentTenant,
    products,
    categories,
    loading: parentLoading,
    setActiveView,
    onOpenAddProduct,
    apiCall
}) {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const currency = currentTenant?.currency || 'SAR';

    const fetchMetrics = async () => {
        setLoading(true);
        setError(null);
        try {
            if (apiCall) {
                const res = await apiCall('/api/v1/merchant/metrics');
                if (res.status === 200 && res.data) {
                    setMetrics(res.data);
                } else {
                    setError(res.data?.message || 'تعذر تحميل مؤشرات المتجر المباشرة');
                }
            }
        } catch (err) {
            setError(err.message || 'حدث خطأ أثناء جلب البيانات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, [currentTenant?.id]);

    // Fallbacks if metrics haven't loaded yet
    const summary = metrics?.summary || {
        total_orders: 0,
        pending_orders: 0,
        completed_orders: 0,
        total_revenue: 0,
        total_products: products?.length || 0,
        active_products: products?.filter(p => p.status === 'active')?.length || 0,
        total_inventory_units: products?.reduce((acc, p) => acc + (parseInt(p.stock_quantity) || 0), 0) || 0,
        total_inventory_value: products?.reduce((acc, p) => acc + (parseFloat(p.price || 0) * (parseInt(p.stock_quantity) || 0)), 0) || 0,
        low_stock_products_count: products?.filter(p => (parseInt(p.stock_quantity) || 0) <= 5)?.length || 0
    };

    const recentOrders = metrics?.recent_orders || [];
    const bestSellers = metrics?.best_sellers || [];
    const lowStockProducts = metrics?.low_stock_products || [];
    const salesTrend = metrics?.sales_trend || [];

    const maxTrendRevenue = Math.max(...salesTrend.map(t => t.revenue || 0), 100);

    return (
        <div className="space-y-8 pb-12">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            متجر نشط ومعزول سحابياً (Tenant #{currentTenant?.id || '—'})
                        </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        مرحباً بك، {currentUser?.name || 'التاجر'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        مؤشرات وبيانات حية وموثوقة لمتجر <span className="font-semibold text-slate-700">{currentTenant?.name || 'متجر العرض'}</span> مباشرة من قاعدة البيانات.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={fetchMetrics}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-200"
                        title="تحديث البيانات"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>تحديث المؤشرات</span>
                    </button>

                    <button
                        onClick={onOpenAddProduct}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-700/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>إضافة منتج</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={fetchMetrics} className="underline font-bold">إعادة المحاولة</button>
                </div>
            )}

            {/* KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                
                {/* 1. Verified Revenue */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
                    <div className="flex items-center justify-between text-slate-500 mb-3">
                        <span className="text-xs font-bold text-slate-600">إجمالي الإيرادات المؤكدة</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums mb-1">
                        {parseFloat(summary.total_revenue || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-500">{currency}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>من الطلبات المدفوعة والمكتملة فقط</span>
                    </div>
                </div>

                {/* 2. Total Orders & Pending */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
                    <div className="flex items-center justify-between text-slate-500 mb-3">
                        <span className="text-xs font-bold text-slate-600">إجمالي الطلبات</span>
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                            <ShoppingCart className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums mb-1">
                        {summary.total_orders} <span className="text-xs font-normal text-slate-500">طلب</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                        {summary.pending_orders > 0 ? (
                            <span className="text-amber-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {summary.pending_orders} طلبات بانتظار التجهيز
                            </span>
                        ) : (
                            <span className="text-slate-500">
                                {summary.completed_orders} طلب مكتمل بنجاح
                            </span>
                        )}
                    </div>
                </div>

                {/* 3. Catalog Products */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
                    <div className="flex items-center justify-between text-slate-500 mb-3">
                        <span className="text-xs font-bold text-slate-600">المنتجات النشطة</span>
                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                            <Package className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums mb-1">
                        {summary.active_products} / {summary.total_products} <span className="text-xs font-normal text-slate-500">منتج</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{categories.length} أقسام وتصنيفات مفعلة</span>
                    </div>
                </div>

                {/* 4. Total Stock Units & Alerts */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
                    <div className="flex items-center justify-between text-slate-500 mb-3">
                        <span className="text-xs font-bold text-slate-600">وحدات المخزون</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                            <Boxes className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums mb-1">
                        {summary.total_inventory_units} <span className="text-xs font-normal text-slate-500">قطعة</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                        {summary.low_stock_products_count > 0 ? (
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {summary.low_stock_products_count} منتجات تحت حد التنبيه
                            </span>
                        ) : (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                مستويات التخزين آمنة
                            </span>
                        )}
                    </div>
                </div>

            </div>

            {/* Real Sales Trend Chart & Quick Navigation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 7-Day Real Sales Trend */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="font-bold text-sm text-slate-900">حركة المبيعات المؤكدة (آخر 7 أيام)</h3>
                            <p className="text-xs text-slate-500 mt-0.5">مبنية على المبيعات الحقيقية من قاعدة بيانات المتجر الحالي</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            مبيعات فعلية
                        </span>
                    </div>

                    {/* Chart Bars */}
                    <div className="pt-4 pb-2">
                        {salesTrend.length === 0 ? (
                            <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
                                لا توجد حركات مبيعات كافية في الأيام الماضية
                            </div>
                        ) : (
                            <div className="h-44 flex items-end justify-between gap-3 px-2">
                                {salesTrend.map((day, idx) => {
                                    const heightPercent = maxTrendRevenue > 0 
                                        ? Math.max(Math.round(((day.revenue || 0) / maxTrendRevenue) * 100), 6)
                                        : 6;
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded shadow">
                                                {parseFloat(day.revenue || 0).toLocaleString('ar-SA')} {currency} ({day.orders_count} طلب)
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-t-xl h-36 flex items-end overflow-hidden p-1">
                                                <div 
                                                    className="w-full bg-gradient-to-t from-emerald-600 to-teal-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                                                    style={{ height: `${heightPercent}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-900 transition">
                                                {day.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Shortcuts & Tools */}
                <div className="space-y-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                        <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">اختصارات الإدارة السريعة</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                                onClick={() => setActiveView('orders')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-right font-semibold text-slate-800 transition"
                            >
                                <ShoppingCart className="w-4 h-4 text-emerald-600 mb-1" />
                                <div>إدارة الطلبات</div>
                            </button>

                            <button
                                onClick={() => setActiveView('inventory')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-right font-semibold text-slate-800 transition"
                            >
                                <Boxes className="w-4 h-4 text-amber-600 mb-1" />
                                <div>تعديل المخزون</div>
                            </button>

                            <button
                                onClick={() => setActiveView('customers')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-right font-semibold text-slate-800 transition"
                            >
                                <Users className="w-4 h-4 text-indigo-600 mb-1" />
                                <div>دليل العملاء</div>
                            </button>

                            <button
                                onClick={() => setActiveView('settings')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-right font-semibold text-slate-800 transition"
                            >
                                <Sparkles className="w-4 h-4 text-teal-600 mb-1" />
                                <div>إعدادات المتجر</div>
                            </button>
                        </div>
                    </div>

                    {/* Best-Sellers Box */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-amber-500" />
                                <span>المنتجات الأكثر مبيعاً</span>
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium">سجلات حقيقية</span>
                        </div>

                        {bestSellers.length === 0 ? (
                            <div className="text-center py-4 text-xs text-slate-400">
                                لا توجد مبيعات مكتملة بعد لحساب الأكثر طلباً
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {bestSellers.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                                                {idx + 1}
                                            </span>
                                            <span className="font-bold text-slate-800 truncate">{item.product_name}</span>
                                        </div>
                                        <div className="font-mono text-emerald-700 font-bold shrink-0">
                                            {item.units_sold} قطعة
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Low Stock Warning Banner (if any) */}
            {lowStockProducts.length > 0 && (
                <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-xs text-amber-900">
                                تنبيه إعادة طلب: هناك {lowStockProducts.length} منتجات وصلت إلى حد التنبيه المخزوني أو أقل
                            </div>
                            <div className="text-[11px] text-amber-700 mt-0.5">
                                المنتجات: {lowStockProducts.map(p => `${p.name} (${p.stock_quantity} ق)`).slice(0, 4).join(' ، ')}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setActiveView('inventory')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-xs"
                    >
                        فتح إدارة المخزون والتوريد
                    </button>
                </div>
            )}

            {/* Recent Orders Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-sm text-slate-900">أحدث الطلبات الواردة</h3>
                        <p className="text-xs text-slate-500 mt-0.5">آخر العمليات الشرائية المعتمدة للمتجر</p>
                    </div>

                    <button
                        onClick={() => setActiveView('orders')}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
                    >
                        <span>عرض جميع الطلبات ({summary.total_orders})</span>
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                            لا توجد طلبات واردة حتى الآن في هذا المتجر
                        </div>
                    ) : (
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                                <tr>
                                    <th className="py-3 px-5">رقم الطلب</th>
                                    <th className="py-3 px-5">العميل</th>
                                    <th className="py-3 px-5">المدينة</th>
                                    <th className="py-3 px-5">المبلغ</th>
                                    <th className="py-3 px-5">حالة الدفع</th>
                                    <th className="py-3 px-5">حالة الطلب</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {recentOrders.map((ord) => (
                                    <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                                        <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{ord.order_number}</td>
                                        <td className="py-3.5 px-5 font-bold text-slate-800">{ord.customer_name}</td>
                                        <td className="py-3.5 px-5 text-slate-500">{ord.customer_city || '—'}</td>
                                        <td className="py-3.5 px-5 font-bold tabular-nums text-slate-900">
                                            {parseFloat(ord.total).toFixed(2)} {ord.currency || currency}
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                ord.payment_status === 'paid'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {ord.payment_status === 'paid' ? 'مدفوع' : 'بانتظار الدفع'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                                                {ord.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
}
