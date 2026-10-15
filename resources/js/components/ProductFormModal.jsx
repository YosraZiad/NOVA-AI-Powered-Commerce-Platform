import React, { useState, useEffect } from 'react';
import { 
    X, Package, DollarSign, Boxes, Tag, 
    Sparkles, AlertCircle, Check, Info, Layers, 
    ArrowRight 
} from 'lucide-react';

export default function ProductFormModal({
    isOpen,
    onClose,
    onSave,
    editingProduct,
    categories,
    currentTenant
}) {
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'pricing' | 'variants'

    // Form fields
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [price, setPrice] = useState('');
    const [compareAtPrice, setCompareAtPrice] = useState('');
    const [stockQuantity, setStockQuantity] = useState(10);
    const [categoryId, setCategoryId] = useState('');
    const [status, setStatus] = useState('active');
    const [description, setDescription] = useState('');

    // Inline errors & feedback
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const currency = currentTenant?.currency || 'SAR';

    // Populate data when editing
    useEffect(() => {
        if (editingProduct) {
            setName(editingProduct.name || '');
            setSku(editingProduct.sku || '');
            setPrice(editingProduct.price ? editingProduct.price.toString() : '');
            setCompareAtPrice(editingProduct.compare_at_price ? editingProduct.compare_at_price.toString() : '');
            setStockQuantity(editingProduct.stock_quantity ?? 10);
            setCategoryId(editingProduct.category_id ? editingProduct.category_id.toString() : (editingProduct.category?.id?.toString() || ''));
            setStatus(editingProduct.status || 'active');
            setDescription(editingProduct.description || '');
        } else {
            // New product default values
            setName('');
            setSku('PROD-' + Math.floor(1000 + Math.random() * 9000));
            setPrice('');
            setCompareAtPrice('');
            setStockQuantity(10);
            setCategoryId(categories[0]?.id?.toString() || '');
            setStatus('active');
            setDescription('');
        }
        setErrors({});
        setActiveTab('general');
    }, [editingProduct, isOpen, categories]);

    if (!isOpen) return null;

    // AI Smart Description Suggestion (Simulated feature)
    const handleGenerateAiDescription = () => {
        if (!name.trim()) {
            setErrors(prev => ({ ...prev, name: 'يرجى إدخال اسم المنتج أولاً لصياغة الوصف الذكي' }));
            return;
        }
        setDescription(`منتج "${name}" بتصميم عصري وتقنية متطورة، مصمم بأعلى معايير الجودة لضمان المتانة والأداء المثالي مع ضمان شامل وتوصيل سريع.`);
        setErrors(prev => ({ ...prev, name: null }));
    };

    const validateForm = () => {
        const errs = {};
        if (!name.trim()) errs.name = 'اسم المنتج مطلوب';
        if (!sku.trim()) errs.sku = 'رمز التخزين SKU مطلوب';
        if (!price || parseFloat(price) <= 0) errs.price = 'السعر يجب أن يكون أكبر من صفر';
        if (compareAtPrice && parseFloat(compareAtPrice) <= parseFloat(price)) {
            errs.compareAtPrice = 'سعر المقارنة (قبل الخصم) يجب أن يكون أكبر من السعر الأساسي';
        }
        if (stockQuantity === '' || parseInt(stockQuantity) < 0) {
            errs.stockQuantity = 'كمية المخزون لا يمكن أن تكون سالبة';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);

        const payload = {
            name: name.trim(),
            sku: sku.trim().toUpperCase(),
            price: parseFloat(price),
            compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
            stock_quantity: parseInt(stockQuantity),
            status,
            category_id: categoryId ? parseInt(categoryId) : null,
            description: description.trim() || null
        };

        const success = await onSave(payload, editingProduct?.id);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div 
                className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 overflow-hidden flex items-center justify-center font-bold shrink-0">
                            {editingProduct?.image_url || editingProduct?.images?.[0]?.url ? (
                                <img src={editingProduct.image_url || editingProduct.images?.[0]?.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <Package className="w-5 h-5" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-black text-base text-slate-900">
                                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للكتالوج'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                نطاق المتجر: <span className="font-semibold text-slate-700">{currentTenant?.name || 'نوفا'}</span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 bg-white px-6 text-xs font-bold">
                    <button
                        type="button"
                        onClick={() => setActiveTab('general')}
                        className={`py-3.5 px-4 border-b-2 transition flex items-center gap-2 ${
                            activeTab === 'general'
                                ? 'border-emerald-600 text-emerald-700'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Tag className="w-4 h-4" />
                        <span>البيانات الأساسية</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('pricing')}
                        className={`py-3.5 px-4 border-b-2 transition flex items-center gap-2 ${
                            activeTab === 'pricing'
                                ? 'border-emerald-600 text-emerald-700'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <DollarSign className="w-4 h-4" />
                        <span>الأسعار والمخزون</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('variants')}
                        className={`py-3.5 px-4 border-b-2 transition flex items-center gap-2 ${
                            activeTab === 'variants'
                                ? 'border-emerald-600 text-emerald-700'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Boxes className="w-4 h-4" />
                        <span>الخيارات والمتغيرات</span>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto">
                    
                    {/* Tab 1: General Info */}
                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    اسم المنتج بالعربية <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: null })); }}
                                    placeholder="مثال: ساعة يد ذكية مقاومة للماء"
                                    className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white transition ${
                                        errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-500'
                                    }`}
                                />
                                {errors.name && (
                                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        التصنيف
                                    </label>
                                    <select
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition font-medium"
                                    >
                                        <option value="">بدون تصنيف</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        حالة النشر
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition font-medium"
                                    >
                                        <option value="active">نشط (معروض في المتجر)</option>
                                        <option value="draft">مسودة (غير معروض)</option>
                                        <option value="archived">مؤرشف</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-slate-700">
                                        الوصف التفصيلي
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateAiDescription}
                                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>توليد وصف ذكي بالـ AI</span>
                                    </button>
                                </div>
                                <textarea
                                    rows="3"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="مواصفات ومميزات المنتج التي تظهر للمشتري في المتجر..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                                ></textarea>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Pricing & Stock */}
                    {activeTab === 'pricing' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        سعر البيع ({currency}) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => { setPrice(e.target.value); setErrors(prev => ({ ...prev, price: null })); }}
                                        placeholder="199.00"
                                        className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs text-slate-900 tabular-nums focus:outline-none focus:bg-white transition ${
                                            errors.price ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-500'
                                        }`}
                                    />
                                    {errors.price && (
                                        <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.price}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        سعر المقارنة (قبل الخصم)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={compareAtPrice}
                                        onChange={(e) => { setCompareAtPrice(e.target.value); setErrors(prev => ({ ...prev, compareAtPrice: null })); }}
                                        placeholder="249.00"
                                        className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs text-slate-900 tabular-nums focus:outline-none focus:bg-white transition ${
                                            errors.compareAtPrice ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-500'
                                        }`}
                                    />
                                    {errors.compareAtPrice && (
                                        <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.compareAtPrice}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        رمز التخزين SKU <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={sku}
                                        onChange={(e) => { setSku(e.target.value.toUpperCase()); setErrors(prev => ({ ...prev, sku: null })); }}
                                        placeholder="ELEC-SMART-001"
                                        className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:bg-white transition ${
                                            errors.sku ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-500'
                                        }`}
                                    />
                                    {errors.sku && (
                                        <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.sku}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        كمية المخزون الجاهزة <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={stockQuantity}
                                        onChange={(e) => { setStockQuantity(e.target.value); setErrors(prev => ({ ...prev, stockQuantity: null })); }}
                                        placeholder="50"
                                        className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs text-slate-900 tabular-nums focus:outline-none focus:bg-white transition ${
                                            errors.stockQuantity ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-500'
                                        }`}
                                    />
                                    {errors.stockQuantity && (
                                        <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.stockQuantity}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Variants Preview */}
                    {activeTab === 'variants' && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
                                <div className="flex items-center gap-2 font-bold text-slate-800">
                                    <Info className="w-4 h-4 text-emerald-600" />
                                    <span>نظام متغيرات المنتجات (Product Variants)</span>
                                </div>
                                <p className="leading-relaxed">
                                    يدعم نظام نوفا خيارات المقاسات والألوان مع عزل كامل لكل متغير برمز SKU وسعر ومخزون منفصل.
                                </p>
                            </div>

                            <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                                <span className="text-xs font-bold text-slate-800">أمثلة لمتغيرات مدعومة:</span>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                        <div className="font-bold text-slate-900 mb-1">المقاسات (Sizes)</div>
                                        <div className="text-[11px] text-slate-500">S, M, L, XL, XXL</div>
                                    </div>
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                        <div className="font-bold text-slate-900 mb-1">الألوان (Colors)</div>
                                        <div className="text-[11px] text-slate-500">أسود، أبيض، فضي، كحلي</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                        >
                            إلغاء
                        </button>

                        <div className="flex items-center gap-2">
                            {activeTab !== 'variants' ? (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab(activeTab === 'general' ? 'pricing' : 'variants')}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                >
                                    <span>التالي</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            ) : null}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-700/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>جاري الحفظ...</span>
                                    </>
                                ) : (
                                    <span>{editingProduct ? 'تحديث المنتج' : 'حفظ ونشر المنتج'}</span>
                                )}
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}
