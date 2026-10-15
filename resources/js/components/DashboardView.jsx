import React, { useState } from 'react';
import { 
    Package, Layers, Plus, Trash2, Search, Filter, 
    ArrowUpDown, AlertCircle, CheckCircle2, ShieldAlert, 
    Store, Boxes, Tag, DollarSign, X, Check 
} from 'lucide-react';

export default function DashboardView({ 
    currentUser, 
    currentTenant, 
    products, 
    categories, 
    loading, 
    loadProducts, 
    loadCategories, 
    apiCall,
    setActiveView 
}) {
    const [dashTab, setDashTab] = useState('products'); // 'products' | 'categories'

    // Product Modal State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '', sku: '', price: '', compare_at_price: '', stock_quantity: 10,
        category_id: '', status: 'active', description: ''
    });

    // Category Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: '', slug: '', description: ''
    });

    const [actionMsg, setActionMsg] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const isCustomer = currentUser?.roles?.includes('Customer') && !currentUser?.roles?.includes('Merchant') && !currentUser?.roles?.includes('Staff');
    const currencySymbol = currentTenant?.currency || 'USD';

    // Show temporary feedback toast
    const showNotice = (text, type = 'success') => {
        setActionMsg({ text, type });
        setTimeout(() => setActionMsg(null), 3500);
    };

    // Create Product Submit
    const handleCreateProduct = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            name: newProduct.name,
            sku: newProduct.sku,
            price: parseFloat(newProduct.price),
            compare_at_price: newProduct.compare_at_price ? parseFloat(newProduct.compare_at_price) : null,
            stock_quantity: parseInt(newProduct.stock_quantity) || 0,
            status: newProduct.status,
            category_id: newProduct.category_id ? parseInt(newProduct.category_id) : null,
            description: newProduct.description || null
        };

        const res = await apiCall('/api/v1/products', {
            method: 'POST',
            body: payload
        });

        if (res.status === 201) {
            setIsProductModalOpen(false);
            setNewProduct({
                name: '', sku: '', price: '', compare_at_price: '', stock_quantity: 10,
                category_id: '', status: 'active', description: ''
            });
            showNotice('تمت إضافة المنتج بنجاح إلى كتالوج المتجر!', 'success');
            await loadProducts();
        } else {
            const err = res.data?.errors ? Object.values(res.data.errors).flat().join(' | ') : res.data?.message;
            showNotice('فشل إنشاء المنتج: ' + (err || 'خطأ في التحقق'), 'error');
        }

        setSubmitting(false);
    };

    // Delete Product
    const handleDeleteProduct = async (product) => {
        if (!confirm(`هل أنت متأكد من حذف المنتج: "${product.name}"؟`)) return;

        const res = await apiCall(`/api/v1/products/${product.id}`, { method: 'DELETE' });

        if (res.status === 200) {
            showNotice(`تم حذف المنتج #${product.id} بنجاح.`, 'success');
            await loadProducts();
        } else {
            showNotice(`تم رفض الحذف: ${res.data?.message || 'غير مصرح'} (كود ${res.status})`, 'error');
        }
    };

    // Create Category Submit
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            name: newCategory.name,
            slug: newCategory.slug || undefined,
            description: newCategory.description || null
        };

        const res = await apiCall('/api/v1/categories', {
            method: 'POST',
            body: payload
        });

        if (res.status === 201) {
            setIsCategoryModalOpen(false);
            setNewCategory({ name: '', slug: '', description: '' });
            showNotice('تمت إضافة التصنيف بنجاح!', 'success');
            await loadCategories();
        } else {
            const err = res.data?.errors ? Object.values(res.data.errors).flat().join(' | ') : res.data?.message;
            showNotice('فشل إضافة التصنيف: ' + err, 'error');
        }

        setSubmitting(false);
    };

    // Delete Category (Safe delete check)
    const handleDeleteCategory = async (category) => {
        const res = await apiCall(`/api/v1/categories/${category.id}`, { method: 'DELETE' });

        if (res.status === 200) {
            showNotice(`تم حذف التصنيف "${category.name}" بنجاح.`, 'success');
            await loadCategories();
        } else {
            showNotice(`رفض الحذف الآمن: ${res.data?.message || 'التصنيف يحتوي على منتجات مرتبطة ولن يُحذف عشوائياً.'}`, 'error');
        }
    };

    // If user is logged in as Customer
    if (isCustomer) {
        return (
            <div className="max-w-2xl mx-auto py-16 text-center space-y-5 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-white">أنت مسجل حالياً بحساب "عميل متسوق" (Customer)</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    لوحة التحكم مخصصة للتجار والمشرفين لإدارة الكتالوج والمخزون. يمكنك التسوق مباشرة عبر المتجر أو التبديل لحساب التاجر للتجربة.
                </p>
                <div className="flex items-center justify-center gap-3 pt-3">
                    <button
                        onClick={() => setActiveView('storefront')}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition"
                    >
                        العودة للمتجر والتسوق
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-16">
            
            {/* Action Feedback Banner */}
            {actionMsg && (
                <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 shadow-lg animate-in fade-in duration-200 ${
                    actionMsg.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}>
                    {actionMsg.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <span>{actionMsg.text}</span>
                </div>
            )}

            {/* Dashboard Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                    <div>
                        <div className="text-xs text-slate-400 font-semibold mb-1">إجمالي المنتجات</div>
                        <div className="text-2xl font-black text-white">{products.length}</div>
                        <div className="text-[10px] text-indigo-400 mt-1">في المتجر الحالي</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Package className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                    <div>
                        <div className="text-xs text-slate-400 font-semibold mb-1">التصنيفات المعتمدة</div>
                        <div className="text-2xl font-black text-white">{categories.length}</div>
                        <div className="text-[10px] text-purple-400 mt-1">معزولة للـ Tenant</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Layers className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                    <div>
                        <div className="text-xs text-slate-400 font-semibold mb-1">إجمالي قطع المخزون</div>
                        <div className="text-2xl font-black text-white">
                            {products.reduce((acc, p) => acc + (parseInt(p.stock_quantity) || 0), 0)}
                        </div>
                        <div className="text-[10px] text-emerald-400 mt-1">جاهزة للطلب</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Boxes className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                    <div>
                        <div className="text-xs text-slate-400 font-semibold mb-1">المتجر / العملة</div>
                        <div className="text-base font-black text-white truncate max-w-[140px]">
                            {currentTenant?.name || 'Demo Store'}
                        </div>
                        <div className="text-[10px] text-amber-400 mt-1 font-mono">
                            {currencySymbol} • نشط
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Store className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Dashboard Sub-tabs and Header */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                    
                    {/* Tabs */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setDashTab('products')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                                dashTab === 'products'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <Package className="w-4 h-4" />
                            <span>إدارة المنتجات</span>
                            <span className="bg-slate-950/50 px-1.5 py-0.2 rounded-full text-[10px] font-mono">{products.length}</span>
                        </button>

                        <button
                            onClick={() => setDashTab('categories')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                                dashTab === 'categories'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <Layers className="w-4 h-4" />
                            <span>إدارة التصنيفات</span>
                            <span className="bg-slate-950/50 px-1.5 py-0.2 rounded-full text-[10px] font-mono">{categories.length}</span>
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div>
                        {dashTab === 'products' ? (
                            <button
                                onClick={() => setIsProductModalOpen(true)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
                            >
                                <Plus className="w-4 h-4" />
                                <span>إضافة منتج جديد</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsCategoryModalOpen(true)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
                            >
                                <Plus className="w-4 h-4" />
                                <span>إضافة تصنيف جديد</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Products Table View */}
                {dashTab === 'products' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800">
                                <tr>
                                    <th className="py-3 px-4 rounded-r-xl">المنتج</th>
                                    <th className="py-3 px-4">SKU</th>
                                    <th className="py-3 px-4">التصنيف</th>
                                    <th className="py-3 px-4">السعر</th>
                                    <th className="py-3 px-4">المخزون</th>
                                    <th className="py-3 px-4">الحالة</th>
                                    <th className="py-3 px-4 rounded-l-xl text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-200">
                                {products.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                                <Package className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div>{p.name}</div>
                                                <div className="text-[10px] text-slate-500 font-normal truncate max-w-xs">{p.description}</div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-slate-400">{p.sku}</td>
                                        <td className="py-3.5 px-4">
                                            {p.category ? (
                                                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                                                    {p.category.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600">بدون تصنيف</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 font-bold">
                                            {parseFloat(p.price).toFixed(2)} {currencySymbol}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                                p.stock_quantity > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                            }`}>
                                                {p.stock_quantity}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                                {p.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <button
                                                onClick={() => handleDeleteProduct(p)}
                                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition"
                                                title="حذف المنتج (يتطلب صلاحية التاجر)"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Categories Table View */
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800">
                                <tr>
                                    <th className="py-3 px-4 rounded-r-xl">اسم التصنيف</th>
                                    <th className="py-3 px-4">الـ Slug</th>
                                    <th className="py-3 px-4">الوصف</th>
                                    <th className="py-3 px-4">المنتجات المرتبطة</th>
                                    <th className="py-3 px-4 rounded-l-xl text-center">فحص الحذف الآمن</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-200">
                                {categories.map((c) => {
                                    const linkedCount = products.filter(p => p.category_id === c.id || p.category?.id === c.id).length;
                                    return (
                                        <tr key={c.id} className="hover:bg-slate-800/40 transition">
                                            <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                                                <span>{c.name}</span>
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-slate-400">{c.slug}</td>
                                            <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{c.description || '—'}</td>
                                            <td className="py-3.5 px-4">
                                                <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                                                    {linkedCount} منتجات
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteCategory(c)}
                                                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 mx-auto"
                                                    title="اختبار محاولة حذف التصنيف الآمن"
                                                >
                                                    <Trash2 className="w-3 h-3 text-rose-400" />
                                                    <span>اختبار الحذف</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Product Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div 
                        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <h3 className="font-extrabold text-base text-white">إضافة منتج جديد إلى الكتالوج</h3>
                            <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 mb-1 font-bold">اسم المنتج</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    placeholder="سماعات رأس لاسلكية احترافية"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 mb-1 font-bold">رمز المنتج (SKU)</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={newProduct.sku}
                                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })}
                                        placeholder="PROD-001"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 mb-1 font-bold">التصنيف</label>
                                    <select 
                                        value={newProduct.category_id}
                                        onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">بدون تصنيف</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-slate-300 mb-1 font-bold">السعر ({currencySymbol})</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        required 
                                        value={newProduct.price}
                                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                        placeholder="99.99"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 mb-1 font-bold">السعر القديم</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={newProduct.compare_at_price}
                                        onChange={(e) => setNewProduct({ ...newProduct, compare_at_price: e.target.value })}
                                        placeholder="129.99"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 mb-1 font-bold">كمية المخزون</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={newProduct.stock_quantity}
                                        onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 mb-1 font-bold">الوصف</label>
                                <textarea 
                                    rows="2"
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="مواصفات وتفاصيل المنتج..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                                ></textarea>
                            </div>

                            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsProductModalOpen(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
                                >
                                    {submitting ? 'جاري الحفظ...' : 'حفظ المنتج'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div 
                        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <h3 className="font-extrabold text-base text-white">إضافة تصنيف جديد</h3>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 mb-1 font-bold">اسم التصنيف</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    placeholder="إلكترونيات، أزياء، إلخ..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 mb-1 font-bold">الـ Slug (اختياري)</label>
                                <input 
                                    type="text" 
                                    value={newCategory.slug}
                                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value.toLowerCase() })}
                                    placeholder="electronics"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 mb-1 font-bold">الوصف</label>
                                <textarea 
                                    rows="2"
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                    placeholder="وصف التصنيف..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                                ></textarea>
                            </div>

                            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
                                >
                                    {submitting ? 'جاري الحفظ...' : 'حفظ التصنيف'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
