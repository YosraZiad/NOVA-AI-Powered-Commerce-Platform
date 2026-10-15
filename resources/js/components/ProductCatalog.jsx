import React, { useState } from 'react';
import { 
    Package, Plus, Search, Filter, ArrowUpDown, 
    MoreHorizontal, Edit, Trash2, Eye, X, 
    AlertCircle, CheckCircle2, LayoutGrid, LayoutList, 
    ChevronLeft, ChevronRight, Tag, Boxes, Store, 
    Check, AlertTriangle 
} from 'lucide-react';

export default function ProductCatalog({
    products,
    categories,
    currentTenant,
    loading,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    onOpenAddProduct,
    onEditProduct,
    onDeleteProduct,
    onViewProduct,
    currentUser
}) {
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
    const [statusFilter, setStatusFilter] = useState(''); // '' | 'active' | 'draft' | 'archived'
    const [stockFilter, setStockFilter] = useState(''); // '' | 'in_stock' | 'low_stock' | 'out_of_stock'

    // Confirmation modal state for deletion
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const currency = currentTenant?.currency || 'SAR';
    const isStaff = currentUser?.roles?.includes('Staff') && !currentUser?.roles?.includes('Merchant') && !currentUser?.roles?.includes('Platform Admin');

    // Filter products locally for instant UX
    const filteredProducts = products.filter(p => {
        if (statusFilter && p.status !== statusFilter) return false;
        if (stockFilter === 'in_stock' && p.stock_quantity <= 0) return false;
        if (stockFilter === 'low_stock' && (p.stock_quantity <= 0 || p.stock_quantity > 15)) return false;
        if (stockFilter === 'out_of_stock' && p.stock_quantity > 0) return false;
        return true;
    });

    const confirmDelete = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        await onDeleteProduct(productToDelete);
        setIsDeleting(false);
        setProductToDelete(null);
    };

    return (
        <div className="space-y-6 pb-12">
            
            {/* Header & Main Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        كتالوج المنتجات
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        إدارة المخزون، الأسعار، وحالات العرض لمتجر <span className="font-semibold text-slate-800">{currentTenant?.name || 'نوفا'}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Switcher */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl text-slate-600 border border-slate-200">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                            title="عرض الجدول"
                        >
                            <LayoutList className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                            title="عرض البطاقات"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={onOpenAddProduct}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-700/20 active:scale-98"
                    >
                        <Plus className="w-4 h-4" />
                        <span>إضافة منتج جديد</span>
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                    
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="بحث بالاسم أو رمز SKU..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                        
                        {/* Category filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 transition font-medium"
                        >
                            <option value="">جميع التصنيفات</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 transition font-medium"
                        >
                            <option value="">جميع الحالات</option>
                            <option value="active">نشط (Active)</option>
                            <option value="draft">مسودة (Draft)</option>
                            <option value="archived">مؤرشف (Archived)</option>
                        </select>

                        {/* Stock filter */}
                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 transition font-medium"
                        >
                            <option value="">حالة المخزون (الكل)</option>
                            <option value="in_stock">متوفر (&gt; 0)</option>
                            <option value="low_stock">مخزون منخفض (&le; 15)</option>
                            <option value="out_of_stock">نفذ من المخزون (0)</option>
                        </select>

                        {/* Sort dropdown */}
                        <select
                            value={`${sortBy}:${sortDir}`}
                            onChange={(e) => {
                                const [field, dir] = e.target.value.split(':');
                                setSortBy(field);
                                setSortDir(dir);
                            }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 transition font-medium"
                        >
                            <option value="created_at:desc">الأحدث إضافة</option>
                            <option value="price:asc">السعر: الأقل أولاً</option>
                            <option value="price:desc">السعر: الأعلى أولاً</option>
                            <option value="name:asc">الاسم: أ - ي</option>
                        </select>

                    </div>

                </div>

                {/* Active Filter Badges */}
                {(search || selectedCategory || statusFilter || stockFilter) && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 font-semibold">فلاتر نشطة:</span>
                        {search && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium">
                                بحث: {search}
                                <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        {selectedCategory && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium">
                                التصنيف: {categories.find(c => c.id.toString() === selectedCategory)?.name || selectedCategory}
                                <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        {statusFilter && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium">
                                الحالة: {statusFilter}
                                <button onClick={() => setStatusFilter('')}><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        {stockFilter && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium">
                                المخزون: {stockFilter}
                                <button onClick={() => setStockFilter('')}><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        <button
                            onClick={() => {
                                setSearch('');
                                setSelectedCategory('');
                                setStatusFilter('');
                                setStockFilter('');
                            }}
                            className="text-slate-500 hover:text-rose-600 font-semibold mr-auto"
                        >
                            مسح جميع الفلاتر
                        </button>
                    </div>
                )}
            </div>

            {/* Content Table or Grid */}
            {loading ? (
                /* Skeleton Loader */
                <div className="bg-white rounded-2xl border border-slate-200/80 p-8 space-y-4">
                    <div className="h-4 bg-slate-100 rounded-lg w-1/4 animate-pulse"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse flex items-center px-4 justify-between">
                                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/6"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/8"></div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : filteredProducts.length === 0 ? (
                /* Empty / No Results State */
                <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center space-y-4 shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                        <Package className="w-8 h-8" />
                    </div>
                    <h3 className="font-extrabold text-base text-slate-800">لا توجد منتجات مطابقة في الكتالوج</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        لم يتم العثور على أي منتج يطابق معايير البحث الحالية في نطاق هذا المتجر. يمكنك إعادة ضبط الفلاتر أو إضافة منتج جديد.
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-3">
                        <button
                            onClick={() => {
                                setSearch('');
                                setSelectedCategory('');
                                setStatusFilter('');
                                setStockFilter('');
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                        >
                            إلغاء الفلاتر
                        </button>
                        <button
                            onClick={onOpenAddProduct}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                        >
                            إضافة منتج الآن
                        </button>
                    </div>
                </div>
            ) : viewMode === 'table' ? (
                /* Table View */
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200/80">
                                <tr>
                                    <th className="py-3.5 px-5">المنتج</th>
                                    <th className="py-3.5 px-5">رمز SKU</th>
                                    <th className="py-3.5 px-5">التصنيف</th>
                                    <th className="py-3.5 px-5">السعر</th>
                                    <th className="py-3.5 px-5">المخزون</th>
                                    <th className="py-3.5 px-5">الحالة</th>
                                    <th className="py-3.5 px-5 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {filteredProducts.map((p) => {
                                    const hasDiscount = p.compare_at_price && parseFloat(p.compare_at_price) > parseFloat(p.price);

                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50/70 transition group">
                                            {/* Product Details */}
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden flex items-center justify-center text-slate-500 shrink-0 group-hover:scale-105 transition">
                                                        {p.image_url || p.images?.[0]?.url ? (
                                                            <img
                                                                src={p.image_url || p.images?.[0]?.url}
                                                                alt={p.name}
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
                                                            style={{ display: (p.image_url || p.images?.[0]?.url) ? 'none' : 'flex' }}
                                                            className="w-full h-full items-center justify-center"
                                                        >
                                                            <Package className="w-5 h-5 text-emerald-600" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-extrabold text-slate-900 text-xs hover:text-emerald-700 transition">
                                                            {p.name}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                                                            {p.description || 'لا يوجد وصف إضافي'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* SKU */}
                                            <td className="py-4 px-5 font-mono text-slate-500 font-semibold">
                                                {p.sku}
                                            </td>

                                            {/* Category */}
                                            <td className="py-4 px-5">
                                                {p.category ? (
                                                    <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-slate-200/60">
                                                        {p.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">غير مصنف</span>
                                                )}
                                            </td>

                                            {/* Price */}
                                            <td className="py-4 px-5 font-bold tabular-nums text-slate-900">
                                                <div>
                                                    {parseFloat(p.price).toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">{currency}</span>
                                                </div>
                                                {hasDiscount && (
                                                    <div className="text-[10px] text-slate-400 line-through">
                                                        {parseFloat(p.compare_at_price).toFixed(2)} {currency}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Stock */}
                                            <td className="py-4 px-5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                                                    p.stock_quantity > 15
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : p.stock_quantity > 0
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        p.stock_quantity > 15 ? 'bg-emerald-500' : p.stock_quantity > 0 ? 'bg-amber-500' : 'bg-rose-500'
                                                    }`}></span>
                                                    <span>{p.stock_quantity} قطعة</span>
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-5">
                                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
                                                    {p.status === 'active' ? 'نشط' : p.status === 'draft' ? 'مسودة' : p.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => onEditProduct(p)}
                                                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition border border-transparent hover:border-emerald-200"
                                                        title="تعديل المنتج"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => setProductToDelete(p)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200"
                                                        title="حذف المنتج (يتطلب صلاحية التاجر)"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer / Summary */}
                    <div className="p-4 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                        <div>
                            إجمالي المعروض: <span className="font-bold text-slate-800">{filteredProducts.length}</span> من أصل <span className="font-bold text-slate-800">{products.length}</span> منتج
                        </div>
                        <div className="font-semibold text-slate-600">
                            نطاق المتجر: {currentTenant?.name || 'الرئيسي'}
                        </div>
                    </div>
                </div>
            ) : (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredProducts.map((p) => (
                        <div 
                            key={p.id}
                            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between space-y-4 group"
                        >
                            <div>
                                <div className="h-44 bg-slate-100/70 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center mb-4 group-hover:scale-[1.02] transition relative">
                                    {p.image_url || p.images?.[0]?.url ? (
                                        <img
                                            src={p.image_url || p.images?.[0]?.url}
                                            alt={p.name}
                                            className="w-full h-full object-cover object-center"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                if (e.currentTarget.nextElementSibling) {
                                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <div 
                                        style={{ display: (p.image_url || p.images?.[0]?.url) ? 'none' : 'flex' }}
                                        className="w-full h-full items-center justify-center"
                                    >
                                        <Package className="w-12 h-12 text-emerald-600/70" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                                    <span>{p.sku}</span>
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.2 rounded font-sans">
                                        {p.category?.name || 'غير مصنف'}
                                    </span>
                                </div>

                                <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition line-clamp-1 mb-1">
                                    {p.name}
                                </h3>

                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                    {p.description || 'منتج عالي الجودة متوفر للطلب.'}
                                </p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                <div>
                                    <div className="text-base font-black text-slate-900 tabular-nums">
                                        {parseFloat(p.price).toFixed(2)} <span className="text-xs font-normal text-slate-500">{currency}</span>
                                    </div>
                                    <span className="text-[11px] text-emerald-700 font-bold">
                                        متوفر: {p.stock_quantity}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onEditProduct(p)}
                                        className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition border border-slate-200"
                                        title="تعديل"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        onClick={() => setProductToDelete(p)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-slate-200"
                                        title="حذف"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {productToDelete && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div 
                        className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6" />
                        </div>

                        <div>
                            <h3 className="font-extrabold text-base text-slate-900">
                                تأكيد حذف المنتج
                            </h3>
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                هل أنت متأكد من رغبتك في حذف المنتج <span className="font-bold text-slate-800">"{productToDelete.name}"</span> (رمز: {productToDelete.sku})؟ سيتم تطبيق الحذف الآمن (Soft Delete) وفق سياسة النظام.
                            </p>
                            {isStaff && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-bold">
                                    تنبيه: أنت مسجل كـ "موظف" (Staff). صلاحية حذف المنتجات مقتصرة على "التاجر" (Merchant Owner) وسيتم صد العملية من الخادم (403).
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                            <button
                                onClick={() => setProductToDelete(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>جاري الحذف...</span>
                                    </>
                                ) : (
                                    <span>نعم، حذف المنتج</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
