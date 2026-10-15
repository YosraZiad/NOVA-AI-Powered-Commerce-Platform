import React, { useState } from 'react';
import { 
    TrendingUp, Package, Layers, Boxes, AlertTriangle, 
    CheckCircle2, ArrowUpRight, ArrowDownRight, Sparkles, 
    Plus, ExternalLink, ShieldCheck, ChevronLeft, Eye, 
    Calendar, RefreshCw, DollarSign, Activity 
} from 'lucide-react';

export default function MerchantDashboard({
    currentUser,
    currentTenant,
    products,
    categories,
    loading,
    setActiveView,
    onOpenAddProduct
}) {
    const [timeframe, setTimeframe] = useState('30d'); // '7d' | '30d' | '90d'

    const currency = currentTenant?.currency || 'SAR';

    // Calculate real inventory KPIs from backend catalog
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    const totalInventoryUnits = products.reduce((acc, p) => acc + (parseInt(p.stock_quantity) || 0), 0);
    const totalCatalogValue = products.reduce((acc, p) => acc + (parseFloat(p.price || 0) * (parseInt(p.stock_quantity) || 0)), 0);
    const lowStockProducts = products.filter(p => (parseInt(p.stock_quantity) || 0) <= 15);

    // Mock trend points for visual chart (clearly labeled as illustrative demo model)
    const chartDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const chartValues = [4200, 5800, 5100, 7400, 6800, 8900, 9650];
    const maxVal = Math.max(...chartValues);

    return (
        <div className="space-y-8 pb-12">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            متجر نشط ومعزول سحابياً
                        </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        مرحباً بك، {currentUser?.name || 'التاجر'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        نظرة عامة على أداء ومخزون <span className="font-semibold text-slate-700">{currentTenant?.name || 'متجر العرض'}</span> اليوم.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Timeframe selector */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200">
                        <button
                            onClick={() => setTimeframe('7d')}
                            className={`px-3 py-1.5 rounded-lg transition ${timeframe === '7d' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'}`}
                        >
                            7 أيام
                        </button>
                        <button
                            onClick={() => setTimeframe('30d')}
                            className={`px-3 py-1.5 rounded-lg transition ${timeframe === '30d' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'}`}
                        >
                            30 يوماً
                        </button>
                        <button
                            onClick={() => setTimeframe('90d')}
                            className={`px-3 py-1.5 rounded-lg transition ${timeframe === '90d' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'}`}
                        >
                            3 أشهر
                        </button>
                    </div>

                    <button
                        onClick={onOpenAddProduct}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-700/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>إضافة منتج</span>
                    </button>
                </div>
            </div>

            {/* KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                
                {/* 1. Catalog Asset Value */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
                    <div className="flex items-center justify-between text-slate-500 mb-3">
                        <span className="text-xs font-bold text-slate-600">قيمة أصول المخزون</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums mb-1">
                        {totalCatalogValue.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-500">{currency}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>مبني على {totalInventoryUnits} قطعة مخزون</span>
                    </div>
                </div>

                {/* 2. Total Products */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
                    <div className="flex items-center justify-between text-slate-500 mb-3">
                        <span className="text-xs font-bold text-slate-600">إجمالي المنتجات</span>
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                            <Package className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums mb-1">
                        {totalProducts} <span className="text-xs font-normal text-slate-500">منتج</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{activeProducts} منتج نشط في الكتالوج</span>
                    </div>
                </div>

                {/* 3. Total Inventory Units */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
                    <div className="flex items-center justify-between text-slate-500 mb-3">
                        <span className="text-xs font-bold text-slate-600">وحدات المخزون المتوفرة</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                            <Boxes className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums mb-1">
                        {totalInventoryUnits} <span className="text-xs font-normal text-slate-500">قطعة</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                        {lowStockProducts.length > 0 ? (
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {lowStockProducts.length} منتجات بحاجة لإعادة طلب
                            </span>
                        ) : (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                مستوى المخزون سليم
                            </span>
                        )}
                    </div>
                </div>

                {/* 4. Categories */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
                    <div className="flex items-center justify-between text-slate-500 mb-3">
                        <span className="text-xs font-bold text-slate-600">التصنيفات المعتمدة</span>
                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                            <Layers className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums mb-1">
                        {categories.length} <span className="text-xs font-normal text-slate-500">أقسام</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                        <span>معزولة بالكامل لنطاق المتجر الحالي</span>
                    </div>
                </div>

            </div>

            {/* Performance Chart & AI Assistant Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sales Activity Trend Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="font-bold text-sm text-slate-900">مؤشر نشاط المبيعات والطلبات التقديري</h3>
                            <p className="text-xs text-slate-500 mt-0.5">حجم المعاملات للأيام السبعة الماضية (نموذج بياني توضيحي للتجربة)</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            +18.4% نمو
                        </span>
                    </div>

                    {/* Chart Bars */}
                    <div className="pt-4 pb-2">
                        <div className="h-44 flex items-end justify-between gap-3 px-2">
                            {chartValues.map((val, idx) => {
                                const heightPercent = Math.round((val / maxVal) * 100);
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded shadow">
                                            {val.toLocaleString('ar-SA')} {currency}
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-t-xl h-36 flex items-end overflow-hidden p-1">
                                            <div 
                                                className="w-full bg-gradient-to-t from-emerald-600 to-teal-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                                                style={{ height: `${heightPercent}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-900 transition">
                                            {chartDays[idx]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* AI Assistant & Quick Actions */}
                <div className="space-y-6">
                    
                    {/* NOVA AI Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-xs uppercase tracking-wider text-emerald-400">NOVA AI Assistant</span>
                            </div>
                            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                                تجريبي
                            </span>
                        </div>

                        <div>
                            <h4 className="font-extrabold text-sm text-white mb-1">
                                توليد أوصاف الكتالوج وتحسين الـ SEO
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                يساعدك مساعد نوفا الذكي في صياغة مواصفات المنتجات والتصنيفات بدقة للأسواق السعودية والخليجية.
                            </p>
                        </div>

                        <button 
                            onClick={onOpenAddProduct}
                            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-950"
                        >
                            <span>تجربة توليد منتج ذكي</span>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Quick Access Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                        <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">إجراءات سريعة</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                                onClick={() => setActiveView('products')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-right font-semibold text-slate-800 transition"
                            >
                                <Package className="w-4 h-4 text-emerald-600 mb-1" />
                                <div>كتالوج المنتجات</div>
                            </button>

                            <button
                                onClick={() => setActiveView('categories')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-right font-semibold text-slate-800 transition"
                            >
                                <Layers className="w-4 h-4 text-teal-600 mb-1" />
                                <div>إدارة التصنيفات</div>
                            </button>

                            <button
                                onClick={() => setActiveView('storefront')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-right font-semibold text-slate-800 transition"
                            >
                                <ExternalLink className="w-4 h-4 text-indigo-600 mb-1" />
                                <div>معاينة المتجر</div>
                            </button>

                            <button
                                onClick={() => setActiveView('security_lab')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-right font-semibold text-slate-800 transition"
                            >
                                <ShieldCheck className="w-4 h-4 text-amber-600 mb-1" />
                                <div>فحص الأمان M1/M2</div>
                            </button>
                        </div>
                    </div>

                </div>

            </div>

            {/* Low Stock Warning Banner (if any) */}
            {lowStockProducts.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-xs text-amber-900">
                                تنبيه مخزون: هناك {lowStockProducts.length} منتجات قاربت على النفاد (أقل من 15 قطعة)
                            </div>
                            <div className="text-[11px] text-amber-700 mt-0.5">
                                المنتجات: {lowStockProducts.map(p => p.name).slice(0, 3).join('، ')}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setActiveView('products')}
                        className="px-3.5 py-1.5 bg-white text-amber-800 border border-amber-300 hover:bg-amber-100 rounded-xl text-xs font-bold transition shrink-0"
                    >
                        مراجعة المخزون في الكتالوج
                    </button>
                </div>
            )}

            {/* Recent Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-sm text-slate-900">أحدث المنتجات في الكتالوج</h3>
                        <p className="text-xs text-slate-500 mt-0.5">آخر المنتجات المضافة في نطاق {currentTenant?.name || 'المتجر'}</p>
                    </div>

                    <button
                        onClick={() => setActiveView('products')}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
                    >
                        <span>عرض جميع المنتجات ({products.length})</span>
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                            <tr>
                                <th className="py-3 px-5">المنتج</th>
                                <th className="py-3 px-5">رمز SKU</th>
                                <th className="py-3 px-5">التصنيف</th>
                                <th className="py-3 px-5">السعر</th>
                                <th className="py-3 px-5">المخزون</th>
                                <th className="py-3 px-5">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {products.slice(0, 5).map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/60 transition">
                                    <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 font-bold">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        <div className="truncate max-w-xs">{p.name}</div>
                                    </td>
                                    <td className="py-3.5 px-5 font-mono text-slate-500">{p.sku}</td>
                                    <td className="py-3.5 px-5">
                                        {p.category ? (
                                            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px]">
                                                {p.category.name}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-5 font-bold tabular-nums text-slate-900">
                                        {parseFloat(p.price).toFixed(2)} {currency}
                                    </td>
                                    <td className="py-3.5 px-5">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                                            p.stock_quantity > 15
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : p.stock_quantity > 0
                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}>
                                            {p.stock_quantity} قطعة
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-5">
                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                            {p.status || 'نشط'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
