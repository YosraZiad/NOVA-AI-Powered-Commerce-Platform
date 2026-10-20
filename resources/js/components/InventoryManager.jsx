import React, { useState, useEffect } from 'react';
import { 
    Boxes, AlertTriangle, CheckCircle2, XCircle, Search, 
    Filter, RefreshCw, Plus, Minus, Edit3, ArrowUpDown, 
    Layers, TrendingDown, HelpCircle, ShieldAlert 
} from 'lucide-react';

export default function InventoryManager({
    currentTenant,
    currentUser,
    categories,
    apiCall,
    showToast
}) {
    const [inventory, setInventory] = useState([]);
    const [threshold, setThreshold] = useState(5);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('');

    // Modal state for stock adjustment
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' | 'subtract' | 'set'
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    const currency = currentTenant?.currency || 'SAR';

    const loadInventory = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== 'all') params.append('stock_status', statusFilter);
            if (search) params.append('search', search);
            if (selectedCategory) params.append('category_id', selectedCategory);

            const res = await apiCall(`/api/v1/inventory?${params.toString()}`);
            if (res.status === 200 && res.data) {
                setInventory(res.data.data || []);
                if (res.data.threshold !== undefined) {
                    setThreshold(res.data.threshold);
                }
            } else {
                showToast(res.data?.message || 'تعذر تحميل بيانات المخزون', 'error');
            }
        } catch (err) {
            showToast('حدث خطأ أثناء تحميل المخزون', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, [statusFilter, selectedCategory]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        loadInventory();
    };

    const openAdjustModal = (product) => {
        setSelectedProduct(product);
        setAdjustmentType('add');
        setQuantity('');
        setReason('');
        setFormError(null);
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        const qtyNum = parseInt(quantity, 10);
        if (isNaN(qtyNum) || qtyNum <= 0) {
            setFormError('يرجى إدخال كمية صحيحة موجبة أكبر من صفر');
            return;
        }

        if (adjustmentType === 'subtract' && qtyNum > selectedProduct.stock_quantity) {
            setFormError(`الكمية المراد خصمها (${qtyNum}) تتجاوز المخزون الحالي المتاح (${selectedProduct.stock_quantity})`);
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiCall(`/api/v1/inventory/${selectedProduct.id}/adjust`, {
                method: 'POST',
                body: {
                    adjustment_type: adjustmentType,
                    quantity: qtyNum,
                    reason: reason.trim() || undefined
                }
            });

            if (res.status === 200 && res.data) {
                showToast(`تم تحديث مخزون "${selectedProduct.name}" ليصبح ${res.data.product?.stock_quantity} قطعة`, 'success');
                setSelectedProduct(null);
                loadInventory();
            } else {
                setFormError(res.data?.message || 'فشل تحديث المخزون، تأكد من صحة المدخلات');
            }
        } catch (err) {
            setFormError('حدث خطأ أثناء إرسال طلب تعديل المخزون');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate preview of new quantity
    const getPreviewQuantity = () => {
        if (!selectedProduct) return 0;
        const current = parseInt(selectedProduct.stock_quantity, 10) || 0;
        const inputQty = parseInt(quantity, 10) || 0;
        if (adjustmentType === 'add') return current + inputQty;
        if (adjustmentType === 'subtract') return Math.max(0, current - inputQty);
        if (adjustmentType === 'set') return inputQty;
        return current;
    };

    return (
        <div className="space-y-6 pb-12">
            
            {/* Header / Intro Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            إدارة الجرد والتوريد الذرّي (M4)
                        </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">مستويات المخزون وحركات التوريد</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        تتبع كميات المنتجات بدقة، مراقبة حد الطلب الأدنى ({threshold} قطع)، وتعديل المخزون مع حماية من الأعداد السالبة.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadInventory}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>تحديث القائمة</span>
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="ابحث باسم المنتج أو رمز SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 font-medium"
                    />
                    <button
                        type="submit"
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                </form>

                {/* Status Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 overflow-x-auto">
                    {[
                        { id: 'all', label: 'الكل' },
                        { id: 'low_stock', label: 'قاربت على النفاد' },
                        { id: 'out_of_stock', label: 'نافدة' },
                        { id: 'in_stock', label: 'متوفرة بكثرة' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                                statusFilter === tab.id
                                    ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                                    : 'hover:text-slate-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Category Dropdown */}
                {categories && categories.length > 0 && (
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">جميع الأقسام</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                            <span>جاري جلب سجلات المخزون والتوريد...</span>
                        </div>
                    ) : inventory.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                            <Boxes className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="font-bold">لا توجد منتجات مطابقة لهذا الفلتر</p>
                            <p className="text-[11px] text-slate-400">جرب تعديل خيارات البحث أو الفلترة</p>
                        </div>
                    ) : (
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                                <tr>
                                    <th className="py-3.5 px-5">المنتج</th>
                                    <th className="py-3.5 px-5">رمز SKU</th>
                                    <th className="py-3.5 px-5">القسم</th>
                                    <th className="py-3.5 px-5">السعر</th>
                                    <th className="py-3.5 px-5">المخزون الحالي</th>
                                    <th className="py-3.5 px-5">حالة التوفر</th>
                                    <th className="py-3.5 px-5 text-center">إجراءات الجرد</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {inventory.map((item) => {
                                    const isLow = item.stock_quantity > 0 && item.stock_quantity <= threshold;
                                    const isOut = item.stock_quantity <= 0;

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/60 transition">
                                            <td className="py-4 px-5">
                                                <div className="font-bold text-slate-900 max-w-xs truncate">{item.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">ID: #{item.id}</div>
                                            </td>
                                            <td className="py-4 px-5 font-mono text-slate-500">{item.sku}</td>
                                            <td className="py-4 px-5">
                                                {item.category?.name ? (
                                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px]">
                                                        {item.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-5 font-bold tabular-nums text-slate-900">
                                                {parseFloat(item.price).toFixed(2)} {currency}
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-black text-sm text-slate-900 tabular-nums">
                                                        {item.stock_quantity}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">قطعة</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                {isOut ? (
                                                    <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                                        <XCircle className="w-3 h-3" />
                                                        نافد تماماً
                                                    </span>
                                                ) : isLow ? (
                                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        مخزون منخفض (≤ {threshold})
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        متوفر
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-5 text-center">
                                                <button
                                                    onClick={() => openAdjustModal(item)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>تعديل الجرد</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Stock Adjustment Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="font-black text-slate-900 text-base">تعديل جرد المخزون</h3>
                                <p className="text-xs text-slate-500 mt-0.5 font-medium">{selectedProduct.name}</p>
                            </div>
                            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                                الحالي: {selectedProduct.stock_quantity} ق
                            </span>
                        </div>

                        {formError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleAdjustSubmit} className="space-y-4">
                            
                            {/* Adjustment Type Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع العملية</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentType('add')}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                                            adjustmentType === 'add'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>إضافة توريد</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentType('subtract')}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                                            adjustmentType === 'subtract'
                                                ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                        <span>خصم / تالف</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentType('set')}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                                            adjustmentType === 'set'
                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <ArrowUpDown className="w-3.5 h-3.5" />
                                        <span>تعيين مباشر</span>
                                    </button>
                                </div>
                            </div>

                            {/* Quantity Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    {adjustmentType === 'set' ? 'الكمية الإجمالية الجديدة' : 'الكمية المراد تطبيقها'}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="أدخل عدد القطع..."
                                    className="w-full text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-slate-900"
                                />
                            </div>

                            {/* Reason for Audit */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">سبب التعديل (اختياري للتوثيق)</label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="مثال: استلام شحنة جديدة، بضاعة تالفة، جرد فصلي..."
                                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-slate-800"
                                />
                            </div>

                            {/* Preview Calculation */}
                            {quantity && (
                                <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-between text-xs font-bold">
                                    <span className="text-slate-600">المخزون المتوقع بعد العملية:</span>
                                    <span className="font-mono text-emerald-700 text-sm">{getPreviewQuantity()} قطعة</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="pt-2 flex items-center gap-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <span>تأكيد تعديل المخزون</span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedProduct(null)}
                                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                                >
                                    إلغاء
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            )}

        </div>
    );
}
