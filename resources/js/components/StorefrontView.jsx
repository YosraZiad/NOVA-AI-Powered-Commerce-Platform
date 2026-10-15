import React, { useState } from 'react';
import { 
    Search, Filter, ShoppingCart, Eye, Sparkles, 
    Tag, Check, AlertCircle, PackageOpen, ArrowUpDown, 
    X, Plus, Minus, ArrowRight 
} from 'lucide-react';

export default function StorefrontView({ 
    products, 
    categories, 
    currentTenant, 
    loading, 
    addToCart, 
    search, 
    setSearch, 
    selectedCategory, 
    setSelectedCategory, 
    sortBy, 
    setSortBy, 
    sortDir, 
    setSortDir,
    onRefresh
}) {
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [quickViewQty, setQuickViewQty] = useState(1);
    const [addedToast, setAddedToast] = useState(null);

    const handleAddToCart = (product, qty = 1) => {
        addToCart(product, qty);
        setAddedToast(product.name);
        setTimeout(() => setAddedToast(null), 2500);
    };

    const currencySymbol = currentTenant?.currency || 'USD';

    return (
        <div className="space-y-8 pb-16">
            
            {/* Added Toast Notification */}
            {addedToast && (
                <div className="fixed bottom-6 left-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
                    <Check className="w-5 h-5 bg-emerald-500 rounded-full p-0.5" />
                    <div>
                        <div className="font-bold text-xs">تمت الإضافة إلى السلة بنجاح!</div>
                        <div className="text-[11px] text-emerald-100">{addedToast}</div>
                    </div>
                </div>
            )}

            {/* Store Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))] pointer-events-none"></div>
                
                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>متجر معتمد ومستقل (Tenant-Isolated)</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                        مرحباً بك في <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">{currentTenant?.name || 'متجر NOVA'}</span>
                    </h1>

                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 max-w-2xl">
                        {currentTenant?.description || 'تصفح تشكيلتنا المميزة من المنتجات ذات الجودة العالية مع خيارات دفع سلسة وشحن فوري.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
                        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 rounded-xl">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>العملة المعتمدة: {currencySymbol}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 rounded-xl">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                            <span>عدد المنتجات المتاحة: {products.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter and Search Toolbar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    
                    {/* Search Input */}
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ابحث عن منتج بالاسم أو الـ SKU..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Sorting Dropdown */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <span className="text-xs text-slate-400 font-medium shrink-0">ترتيب:</span>
                        <select
                            value={`${sortBy}:${sortDir}`}
                            onChange={(e) => {
                                const [field, dir] = e.target.value.split(':');
                                setSortBy(field);
                                setSortDir(dir);
                            }}
                            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition"
                        >
                            <option value="created_at:desc">الأحدث وصولاً</option>
                            <option value="price:asc">السعر: من الأقل للأعلى</option>
                            <option value="price:desc">السعر: من الأعلى للأقل</option>
                            <option value="name:asc">الاسم: أبجدياً (أ-ي)</option>
                        </select>
                    </div>

                </div>

                {/* Categories Pills Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80">
                    <span className="text-xs font-bold text-slate-400 shrink-0 ml-2">التصنيفات:</span>
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                            selectedCategory === ''
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        الكل ({products.length})
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id.toString())}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                                selectedCategory === cat.id.toString()
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <div className="text-sm font-bold text-slate-300">جاري تحميل المنتجات...</div>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                    <PackageOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-200 mb-1">لا توجد منتجات مطابقة للبحث</h3>
                    <p className="text-xs text-slate-400 mb-4">جرب البحث بكلمة أخرى أو تغيير التصنيف المختار</p>
                    <button
                        onClick={() => { setSearch(''); setSelectedCategory(''); }}
                        className="px-4 py-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 rounded-xl text-xs font-bold transition"
                    >
                        إعادة ضبط الفلاتر
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => {
                        const inStock = product.stock_quantity > 0;
                        const hasDiscount = product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price);

                        return (
                            <div 
                                key={product.id}
                                className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col"
                            >
                                {/* Product Image Card Header */}
                                <div className="h-48 relative bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/40 flex items-center justify-center p-6 border-b border-slate-800 overflow-hidden">
                                    <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                        <PackageOpen className="w-10 h-10 text-indigo-400" />
                                    </div>

                                    {/* Category Badge */}
                                    {product.category && (
                                        <span className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur border border-slate-800 text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                            {product.category.name}
                                        </span>
                                    )}

                                    {/* Discount Badge */}
                                    {hasDiscount && (
                                        <span className="absolute top-3 left-3 bg-rose-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow">
                                            وفر {(parseFloat(product.compare_at_price) - parseFloat(product.price)).toFixed(2)} {currencySymbol}
                                        </span>
                                    )}

                                    {/* Quick View Button overlay */}
                                    <button
                                        onClick={() => {
                                            setQuickViewProduct(product);
                                            setQuickViewQty(1);
                                        }}
                                        className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 text-slate-200 border border-slate-700 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>معاينة سريعة</span>
                                    </button>
                                </div>

                                {/* Product Body */}
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono">
                                            <span>SKU: {product.sku}</span>
                                            {inStock ? (
                                                <span className="text-emerald-400 font-sans font-semibold">متوفر ({product.stock_quantity})</span>
                                            ) : (
                                                <span className="text-rose-400 font-sans font-semibold">نفذ من المخزون</span>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition line-clamp-1 mb-1.5">
                                            {product.name}
                                        </h3>

                                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                            {product.description || 'منتج عالي الجودة مع ضمان شامل.'}
                                        </p>
                                    </div>

                                    {/* Price and Add to Cart */}
                                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-lg font-black text-white">
                                                {parseFloat(product.price).toFixed(2)} <span className="text-xs font-normal text-slate-400">{currencySymbol}</span>
                                            </div>
                                            {hasDiscount && (
                                                <div className="text-xs text-slate-500 line-through">
                                                    {parseFloat(product.compare_at_price).toFixed(2)} {currencySymbol}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleAddToCart(product, 1)}
                                            disabled={!inStock}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                                                inStock
                                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95'
                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                            }`}
                                        >
                                            <ShoppingCart className="w-3.5 h-3.5" />
                                            <span>{inStock ? 'إضافة' : 'غير متوفر'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Quick View Modal */}
            {quickViewProduct && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div 
                        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative p-6 sm:p-8">
                            <button
                                onClick={() => setQuickViewProduct(null)}
                                className="absolute top-5 left-5 text-slate-400 hover:text-white bg-slate-800/60 p-2 rounded-full transition"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-2 mb-3">
                                {quickViewProduct.category && (
                                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                        {quickViewProduct.category.name}
                                    </span>
                                )}
                                <span className="text-xs text-slate-500 font-mono">
                                    SKU: {quickViewProduct.sku}
                                </span>
                            </div>

                            <h2 className="text-2xl font-black text-white mb-3">
                                {quickViewProduct.name}
                            </h2>

                            <p className="text-sm text-slate-300 leading-relaxed mb-6">
                                {quickViewProduct.description || 'تفاصيل المنتج ومواصفاته الكاملة لمتجر ' + (currentTenant?.name || 'NOVA')}
                            </p>

                            <div className="flex items-baseline gap-3 mb-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                                <span className="text-3xl font-black text-white">
                                    {parseFloat(quickViewProduct.price).toFixed(2)} {currencySymbol}
                                </span>
                                {quickViewProduct.compare_at_price && (
                                    <span className="text-base text-slate-500 line-through">
                                        {parseFloat(quickViewProduct.compare_at_price).toFixed(2)} {currencySymbol}
                                    </span>
                                )}
                                <span className="mr-auto text-xs font-bold text-emerald-400">
                                    المخزون المتوفر: {quickViewProduct.stock_quantity} قطعة
                                </span>
                            </div>

                            {/* Quantity Controls & Add to Cart */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                                    <button
                                        onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))}
                                        className="p-2 text-slate-400 hover:text-white transition"
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-10 text-center font-bold text-sm text-white">
                                        {quickViewQty}
                                    </span>
                                    <button
                                        onClick={() => setQuickViewQty(Math.min(quickViewProduct.stock_quantity || 10, quickViewQty + 1))}
                                        className="p-2 text-slate-400 hover:text-white transition"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        handleAddToCart(quickViewProduct, quickViewQty);
                                        setQuickViewProduct(null);
                                    }}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    <span>إضافة إلى السلة</span>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
