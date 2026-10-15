import React, { useState, useMemo } from 'react';
import { 
    Search, ShoppingBag, Eye, Check, X, 
    Sparkles, ShieldCheck, Truck, CreditCard, 
    Package, Plus, Minus, ArrowRight, Tag, 
    Star, RotateCcw, Clock, Layers, Filter, 
    Grid, List, Zap, CheckCircle2, ChevronRight, 
    Heart, ChevronDown, ChevronUp, Share2
} from 'lucide-react';

export default function CustomerStorefront({
    products = [],
    categories = [],
    currentTenant,
    loading = false,
    addToCart,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    onOpenCheckout
}) {
    // Quick View / Product Detail Modal State
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [quickViewQty, setQuickViewQty] = useState(1);
    const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'shipping' | 'warranty'
    
    // Catalog Filtering and Display State
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [priceRange, setPriceRange] = useState('all'); // 'all' | 'under200' | '200to500' | 'above500'
    const [onlyInStock, setOnlyInStock] = useState(false);
    
    // Toast notification
    const [addedToast, setAddedToast] = useState(null);

    const currency = currentTenant?.currency || 'SAR';

    const handleAdd = (product, qty = 1) => {
        addToCart(product, qty);
        setAddedToast({ name: product.name, image: product.image_url || product.images?.[0]?.url });
        setTimeout(() => setAddedToast(null), 3000);
    };

    const handleExpressBuy = (product, qty = 1) => {
        addToCart(product, qty);
        setQuickViewProduct(null);
        if (onOpenCheckout) {
            onOpenCheckout();
        }
    };

    // Filter products on client side for price range and in-stock toggle
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const price = parseFloat(p.price);
            if (onlyInStock && p.stock_quantity <= 0) return false;
            if (priceRange === 'under200' && price >= 200) return false;
            if (priceRange === '200to500' && (price < 200 || price > 500)) return false;
            if (priceRange === 'above500' && price <= 500) return false;
            return true;
        });
    }, [products, priceRange, onlyInStock]);

    // Curated Best Sellers (top 3 products with highest price or discount)
    const bestSellers = useMemo(() => {
        return products.slice(0, 4);
    }, [products]);

    // Category Icon Mapper
    const getCategoryIcon = (slug) => {
        switch (slug) {
            case 'electronics':
                return '🎧';
            case 'apparel':
                return '👕';
            case 'home-living':
                return '💡';
            case 'luxury-fragrances':
                return '✨';
            case 'coffee-lifestyle':
                return '☕';
            default:
                return '🛍️';
        }
    };

    return (
        <div className="space-y-12 pb-16 font-sans">
            
            {/* 1. ADDED TO CART TOAST NOTIFICATION */}
            {addedToast && (
                <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 animate-in fade-in slide-in-from-bottom-5 duration-200 border border-slate-700 max-w-sm">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                        <div className="font-bold text-xs text-emerald-400">تمت الإضافة بنجاح إلى السلة</div>
                        <div className="text-[11px] text-slate-300 truncate mt-0.5">{addedToast.name}</div>
                    </div>
                </div>
            )}

            {/* 2. EDITORIAL RETAIL HERO CAMPAIGN */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-xl border border-slate-800/80">
                {/* Subtle decorative glow */}
                <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    
                    {/* Left Column (RTL): Campaign Copy & Actions */}
                    <div className="lg:col-span-7 space-y-6 text-right">
                        
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-sm">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>مجموعة الموسم 2026 الحصرية • جودة أصلية معتمدة</span>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                                تسوق أرقى المنتجات في <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">{currentTenant?.name || 'متجر نوفا'}</span>
                            </h1>

                            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-normal">
                                وجهتك المثالية لتجربة تسوق إلكتروني متكاملة. منتجات مختارة بعناية من الصوتيات، العطور الشرقية الملكية، أزياء القطن الطبيعي، ومستلزمات القهوة المختصة مع شحن مجاني وسريع لكافة أنحاء المملكة.
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <button
                                onClick={() => {
                                    const el = document.getElementById('store-catalog-section');
                                    el?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl transition shadow-lg shadow-emerald-500/25 flex items-center gap-2 group cursor-pointer"
                            >
                                <span>تصفح التشكيلة الكاملة</span>
                                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedCategory('');
                                    const el = document.getElementById('store-catalog-section');
                                    el?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-2xl font-bold text-xs sm:text-sm transition backdrop-blur-sm"
                            >
                                العروض والتخفيضات الخاصة
                            </button>
                        </div>

                        {/* Trust highlights in hero */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs text-slate-300">
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>شحن لجميع مدن المملكة</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-teal-400 shrink-0" />
                                <span>دفع مريح بمدى و Apple Pay</span>
                            </div>
                            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>ضمان ذهبي 100%</span>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Spotlight Feature Card */}
                    {products.length > 0 && (
                        <div className="lg:col-span-5 hidden lg:block">
                            <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/15 shadow-2xl space-y-4 hover:border-emerald-500/40 transition-all duration-300">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                                        منتج مميز هذا الأسبوع
                                    </span>
                                    <div className="flex items-center gap-1 text-amber-400">
                                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                                        <span className="font-bold text-white text-xs">5.0</span>
                                        <span className="text-[10px] text-slate-300">(تقييم معتمد)</span>
                                    </div>
                                </div>

                                <div className="h-56 rounded-2xl overflow-hidden bg-slate-900/60 relative group">
                                    <img
                                        src={products[0]?.image_url || products[0]?.images?.[0]?.url || '/images/products/headphones.jpg'}
                                        alt={products[0]?.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                                    <div className="absolute bottom-3 right-3 left-3 text-right">
                                        <div className="text-xs font-bold text-emerald-300">{products[0]?.category?.name}</div>
                                        <div className="text-sm font-black text-white truncate">{products[0]?.name}</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <div>
                                        <div className="text-xl font-black text-white tabular-nums">
                                            {parseFloat(products[0]?.price || 0).toFixed(2)} <span className="text-xs font-normal text-slate-300">{currency}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400">شامل ضريبة القيمة المضافة 15%</div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setQuickViewProduct(products[0]);
                                            setQuickViewQty(1);
                                        }}
                                        className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>معاينة وتفاصيل</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* 3. FOUR PILLARS OF TRUST (Saudi & GCC Consumer Guarantees) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 shadow-2xs hover:border-slate-300 transition">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                        <Truck className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                        <h4 className="font-extrabold text-sm text-slate-900">شحن سريع ومجاني</h4>
                        <p className="text-xs text-slate-500 mt-0.5">مجاناً للطلبات فوق 200 {currency} وتوصيل خلال 2-4 أيام</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 shadow-2xs hover:border-slate-300 transition">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                        <h4 className="font-extrabold text-sm text-slate-900">منتجات أصلية 100%</h4>
                        <p className="text-xs text-slate-500 mt-0.5">ضمان الجودة الكاملة من الموردين والماركات المعتمدة</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 shadow-2xs hover:border-slate-300 transition">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center shrink-0">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                        <h4 className="font-extrabold text-sm text-slate-900">دفع آمن ومشفر</h4>
                        <p className="text-xs text-slate-500 mt-0.5">مدى، Apple Pay، والبطاقات الائتمانية مع تشفير مصرفي</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 shadow-2xs hover:border-slate-300 transition">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                        <h4 className="font-extrabold text-sm text-slate-900">إرجاع واستبدال مرن</h4>
                        <p className="text-xs text-slate-500 mt-0.5">استرجاع سهل خلال 14 يوماً وفق الشروط الميسرة</p>
                    </div>
                </div>

            </div>

            {/* 4. VISUAL CATEGORY DISCOVERY RAILS */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900">
                            تسوق حسب الأقسام
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            اختر الفئة المفضلة لاستعراض المنتجات المخصصة
                        </p>
                    </div>

                    {selectedCategory && (
                        <button
                            onClick={() => setSelectedCategory('')}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
                        >
                            عرض جميع الأقسام
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {categories.map((c) => {
                        const isSelected = selectedCategory === c.id.toString();
                        const count = products.filter(p => p.category_id === c.id).length;

                        return (
                            <button
                                key={c.id}
                                onClick={() => {
                                    setSelectedCategory(isSelected ? '' : c.id.toString());
                                    const el = document.getElementById('store-catalog-section');
                                    el?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={`p-4 rounded-2xl border text-right transition-all duration-200 group flex flex-col justify-between ${
                                    isSelected
                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs text-slate-800'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-2xl group-hover:scale-110 transition-transform">
                                        {getCategoryIcon(c.slug)}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {count} منتجات
                                    </span>
                                </div>

                                <div>
                                    <h5 className="font-extrabold text-xs sm:text-sm line-clamp-1">
                                        {c.name}
                                    </h5>
                                    <p className={`text-[11px] line-clamp-1 mt-0.5 ${
                                        isSelected ? 'text-emerald-100' : 'text-slate-400'
                                    }`}>
                                        {c.description || 'تصفح التشكيلة'}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 5. BEST SELLERS / HIGHLIGHTS SECTION */}
            {bestSellers.length > 0 && (
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                <Zap className="w-4 h-4 fill-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                                    الأكثر طلباً ومبيعاً
                                </h3>
                                <p className="text-xs text-slate-500">
                                    المنتجات المفضلة لدى عملائنا في المملكة والخليج
                                </p>
                            </div>
                        </div>

                        <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                            مختارة بعناية
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {bestSellers.map((product) => {
                            const hasDiscount = product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price);
                            const discountAmount = hasDiscount ? (parseFloat(product.compare_at_price) - parseFloat(product.price)).toFixed(0) : 0;
                            const inStock = product.stock_quantity > 0;

                            return (
                                <div
                                    key={`bestseller-${product.id}`}
                                    className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group"
                                >
                                    {/* Image with Tag & Quick View */}
                                    <div className="h-56 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                                        <img
                                            src={product.image_url || product.images?.[0]?.url || '/images/products/headphones.jpg'}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />

                                        {/* Badge */}
                                        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                                            <span className="bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                                                الأكثر مبيعاً ⭐
                                            </span>
                                            {hasDiscount && (
                                                <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                                                    وفر {discountAmount} {currency}
                                                </span>
                                            )}
                                        </div>

                                        {/* Category */}
                                        {product.category && (
                                            <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-xs">
                                                {product.category.name}
                                            </span>
                                        )}

                                        {/* Hover Quick View */}
                                        <button
                                            onClick={() => {
                                                setQuickViewProduct(product);
                                                setQuickViewQty(1);
                                            }}
                                            className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/95 text-slate-800 hover:text-emerald-700 p-2 rounded-xl shadow-md"
                                            title="معاينة سريعة"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-1 text-amber-500 text-[11px] mb-1">
                                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                <span className="font-bold">5.0</span>
                                                <span className="text-slate-400 mr-1">(تقييم معتمد)</span>
                                            </div>

                                            <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition line-clamp-1">
                                                {product.name}
                                            </h4>

                                            <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                                {product.description || 'منتج أصلي عالي الجودة متوفر للطلب الفوري.'}
                                            </p>
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <div>
                                                <div className="text-base font-black text-slate-900 tabular-nums">
                                                    {parseFloat(product.price).toFixed(2)} <span className="text-xs font-normal text-slate-500">{currency}</span>
                                                </div>
                                                {hasDiscount && (
                                                    <div className="text-xs text-slate-400 line-through tabular-nums">
                                                        {parseFloat(product.compare_at_price).toFixed(2)} {currency}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleAdd(product, 1)}
                                                disabled={!inStock}
                                                className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
                                                    inStock
                                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-700/20'
                                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                                title={inStock ? 'إضافة للسلة' : 'نفد المخزون'}
                                            >
                                                <ShoppingBag className="w-4 h-4" />
                                                <span className="text-xs font-bold">{inStock ? 'شراء' : 'نفد'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 6. PROMOTIONAL VOUCHER / DISCOUNT BANNER */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 sm:p-8 shadow-md">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
                    <div className="space-y-1.5 max-w-xl">
                        <span className="inline-block bg-white/20 text-emerald-200 border border-white/20 px-3 py-1 rounded-full text-xs font-black">
                            عرض الشحن المجاني الحصري 🚚
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black">
                            تسوق بقيمة 200 {currency} أو أكثر واحصل على شحن مجاني لكافة مدن المملكة
                        </h3>
                        <p className="text-xs text-emerald-100/80 leading-relaxed">
                            اختر من أفضل المنتجات الأصلية وتمتع بتوصيل سريع وآمن مباشرة إلى باب بيتك.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="bg-white/10 backdrop-blur border border-white/20 px-4 py-2.5 rounded-2xl text-center">
                            <span className="text-[10px] text-emerald-200 block">كود الشحن المجاني</span>
                            <span className="font-mono font-black text-sm tracking-widest text-white">NOVA2026</span>
                        </div>
                        <button
                            onClick={() => {
                                const el = document.getElementById('store-catalog-section');
                                el?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-5 py-3 bg-white text-slate-950 hover:bg-emerald-50 rounded-2xl font-black text-xs transition shadow-md"
                        >
                            تسوق الآن
                        </button>
                    </div>
                </div>
            </div>

            {/* 7. COMPREHENSIVE PRODUCT CATALOG & FILTER SUITE */}
            <div id="store-catalog-section" className="space-y-6 pt-4">
                
                {/* Catalog Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                                كتالوج منتجات المتجر
                            </h3>
                            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                                {filteredProducts.length} منتجات متاحة
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            تصفح جميع المعروضات مع إمكانية الفرز حسب السعر، التوافر، والتصنيف
                        </p>
                    </div>

                    {/* View Mode Toggle (Grid / List) */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-xs text-slate-500 font-semibold hidden sm:inline">طريقة العرض:</span>
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition ${
                                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                                }`}
                                title="عرض شبكي"
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition ${
                                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                                }`}
                                title="عرض قائمة"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                    
                    {/* Upper row: Search, In-stock toggle, Sorting */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
                        
                        {/* Search input */}
                        <div className="md:col-span-5 relative">
                            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="ابحث بالاسم أو رمز SKU..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* In Stock Only Switch */}
                        <div className="md:col-span-3 flex items-center justify-start md:justify-center">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                                <input
                                    type="checkbox"
                                    checked={onlyInStock}
                                    onChange={(e) => setOnlyInStock(e.target.checked)}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                />
                                <span>المتوفر بالمستودع فقط</span>
                            </label>
                        </div>

                        {/* Sorting Select */}
                        <div className="md:col-span-4 flex items-center gap-2 justify-end">
                            <span className="text-xs text-slate-500 font-semibold shrink-0">الترتيب:</span>
                            <select
                                value={`${sortBy}:${sortDir}`}
                                onChange={(e) => {
                                    const [field, dir] = e.target.value.split(':');
                                    setSortBy(field);
                                    setSortDir(dir);
                                }}
                                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500 transition w-full max-w-[200px]"
                            >
                                <option value="created_at:desc">الأحدث وصولاً</option>
                                <option value="price:asc">السعر: من الأقل للأعلى</option>
                                <option value="price:desc">السعر: من الأعلى للأقل</option>
                                <option value="name:asc">الاسم: أبجدياً</option>
                            </select>
                        </div>

                    </div>

                    {/* Middle row: Category Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-100 no-scrollbar">
                        <span className="text-xs font-bold text-slate-500 shrink-0 ml-1">التصنيف:</span>
                        <button
                            onClick={() => setSelectedCategory('')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                selectedCategory === ''
                                    ? 'bg-slate-900 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            الكل ({products.length})
                        </button>
                        {categories.map((c) => {
                            const count = products.filter(p => p.category_id === c.id).length;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedCategory(c.id.toString())}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                                        selectedCategory === c.id.toString()
                                            ? 'bg-emerald-600 text-white shadow-2xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    <span>{c.name}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                        selectedCategory === c.id.toString() ? 'bg-white/20' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Bottom row: Price Range Buttons & Clear Filters */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-semibold">نطاق السعر:</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setPriceRange('all')}
                                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                                        priceRange === 'all' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    الكل
                                </button>
                                <button
                                    onClick={() => setPriceRange('under200')}
                                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                                        priceRange === 'under200' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    أقل من 200 {currency}
                                </button>
                                <button
                                    onClick={() => setPriceRange('200to500')}
                                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                                        priceRange === '200to500' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    200 - 500 {currency}
                                </button>
                                <button
                                    onClick={() => setPriceRange('above500')}
                                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                                        priceRange === 'above500' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    أكثر من 500 {currency}
                                </button>
                            </div>
                        </div>

                        {/* Reset button if any filter is set */}
                        {(search || selectedCategory || priceRange !== 'all' || onlyInStock) && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setSelectedCategory('');
                                    setPriceRange('all');
                                    setOnlyInStock(false);
                                }}
                                className="text-rose-600 hover:text-rose-700 font-bold transition flex items-center gap-1 text-xs"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>إعادة تعيين جميع الفلاتر</span>
                            </button>
                        )}
                    </div>

                </div>

                {/* Catalog Products Display (Loading, Empty, or Grid/List) */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse">
                                <div className="h-52 bg-slate-100 rounded-xl"></div>
                                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                <div className="h-8 bg-slate-100 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center space-y-4 shadow-2xs">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                            <Package className="w-8 h-8" />
                        </div>
                        <h4 className="text-base font-extrabold text-slate-800">لا توجد منتجات مطابقة لخيارات البحث</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            جرب البحث بكلمة مختلفة أو اختر تصنيفاً آخر أو قم بتعديل نطاق السعر.
                        </p>
                        <button
                            onClick={() => {
                                setSearch('');
                                setSelectedCategory('');
                                setPriceRange('all');
                                setOnlyInStock(false);
                            }}
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition"
                        >
                            عرض كافة المنتجات
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* GRID VIEW */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((p) => {
                            const inStock = p.stock_quantity > 0;
                            const hasDiscount = p.compare_at_price && parseFloat(p.compare_at_price) > parseFloat(p.price);

                            return (
                                <div
                                    key={p.id}
                                    className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group"
                                >
                                    {/* Thumbnail */}
                                    <div className="h-56 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                                        <img
                                            src={p.image_url || p.images?.[0]?.url || '/images/products/headphones.jpg'}
                                            alt={p.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />

                                        {/* Category Badge */}
                                        {p.category && (
                                            <span className="absolute top-3 right-3 bg-white/95 backdrop-blur border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                                                {p.category.name}
                                            </span>
                                        )}

                                        {/* Discount Badge */}
                                        {hasDiscount && (
                                            <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-2xs">
                                                خصم {(parseFloat(p.compare_at_price) - parseFloat(p.price)).toFixed(0)} {currency}
                                            </span>
                                        )}

                                        {/* Quick View Button */}
                                        <button
                                            onClick={() => {
                                                setQuickViewProduct(p);
                                                setQuickViewQty(1);
                                            }}
                                            className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/95 text-slate-800 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md hover:text-emerald-700"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>معاينة سريعة</span>
                                        </button>
                                    </div>

                                    {/* Body */}
                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                                                <span>{p.sku}</span>
                                                {inStock ? (
                                                    <span className="text-emerald-700 font-bold font-sans">متوفر ({p.stock_quantity})</span>
                                                ) : (
                                                    <span className="text-rose-600 font-bold font-sans">نفد من المخزون</span>
                                                )}
                                            </div>

                                            <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition line-clamp-1 mb-1">
                                                {p.name}
                                            </h3>

                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {p.description || 'منتج أصلي عالي الجودة متوفر للطلب المباشر.'}
                                            </p>
                                        </div>

                                        {/* Price & Add to Cart */}
                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                                            <div>
                                                <div className="text-base font-black text-slate-900 tabular-nums">
                                                    {parseFloat(p.price).toFixed(2)} <span className="text-xs font-normal text-slate-500">{currency}</span>
                                                </div>
                                                {hasDiscount && (
                                                    <div className="text-xs text-slate-400 line-through tabular-nums">
                                                        {parseFloat(p.compare_at_price).toFixed(2)} {currency}
                                                    </div>
                                                )}
                                                <div className="text-[9px] text-slate-400">شامل الضريبة 15%</div>
                                            </div>

                                            <button
                                                onClick={() => handleAdd(p, 1)}
                                                disabled={!inStock}
                                                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                                                    inStock
                                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-700/20'
                                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                            >
                                                <ShoppingBag className="w-3.5 h-3.5" />
                                                <span>{inStock ? 'إضافة' : 'نفد'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* LIST VIEW */
                    <div className="space-y-4">
                        {filteredProducts.map((p) => {
                            const inStock = p.stock_quantity > 0;
                            const hasDiscount = p.compare_at_price && parseFloat(p.compare_at_price) > parseFloat(p.price);

                            return (
                                <div
                                    key={p.id}
                                    className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row items-center gap-5 group"
                                >
                                    <div className="w-full sm:w-44 h-44 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative flex items-center justify-center">
                                        <img
                                            src={p.image_url || p.images?.[0]?.url || '/images/products/headphones.jpg'}
                                            alt={p.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        {hasDiscount && (
                                            <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-2xs">
                                                خصم {(parseFloat(p.compare_at_price) - parseFloat(p.price)).toFixed(0)} {currency}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-2 text-right w-full">
                                        <div className="flex items-center gap-2">
                                            {p.category && (
                                                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                                                    {p.category.name}
                                                </span>
                                            )}
                                            <span className="text-xs font-mono text-slate-400">{p.sku}</span>
                                            {inStock ? (
                                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mr-auto">
                                                    متوفر في المستودع ({p.stock_quantity})
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full mr-auto">
                                                    نفد من المخزون
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition">
                                            {p.name}
                                        </h3>

                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                            {p.description || 'منتج أصلي عالي الجودة متوفر للطلب المباشر مع شحن سريع.'}
                                        </p>

                                        <div className="flex items-center gap-4 pt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="text-lg font-black text-slate-900 tabular-nums">
                                                    {parseFloat(p.price).toFixed(2)} <span className="text-xs font-normal text-slate-500">{currency}</span>
                                                </div>
                                                {hasDiscount && (
                                                    <div className="text-xs text-slate-400 line-through tabular-nums">
                                                        {parseFloat(p.compare_at_price).toFixed(2)} {currency}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-slate-400">شامل ضريبة القيمة المضافة 15%</span>
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto shrink-0">
                                        <button
                                            onClick={() => handleAdd(p, 1)}
                                            disabled={!inStock}
                                            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                                                inStock
                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                        >
                                            <ShoppingBag className="w-4 h-4" />
                                            <span>{inStock ? 'إضافة للسلة' : 'نفد'}</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setQuickViewProduct(p);
                                                setQuickViewQty(1);
                                            }}
                                            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>تفاصيل</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>

            {/* 8. INTERACTIVE PRODUCT QUICK VIEW & EXPRESS BUY MODAL */}
            {quickViewProduct && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div 
                        className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header bar */}
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                            <div className="flex items-center gap-2">
                                {quickViewProduct.category && (
                                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                        {quickViewProduct.category.name}
                                    </span>
                                )}
                                <span className="text-xs text-slate-400 font-mono">
                                    SKU: {quickViewProduct.sku}
                                </span>
                            </div>

                            <button
                                onClick={() => setQuickViewProduct(null)}
                                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            
                            {/* Product Image Column */}
                            <div className="space-y-4">
                                <div className="h-72 sm:h-80 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative group flex items-center justify-center shadow-inner">
                                    <img 
                                        src={quickViewProduct.image_url || quickViewProduct.images?.[0]?.url || '/images/products/headphones.jpg'} 
                                        alt={quickViewProduct.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />

                                    {quickViewProduct.compare_at_price && (
                                        <span className="absolute top-3 right-3 bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-xs">
                                            وفر {(parseFloat(quickViewProduct.compare_at_price) - parseFloat(quickViewProduct.price)).toFixed(0)} {currency}
                                        </span>
                                    )}
                                </div>

                                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>ضمان ذهبي سنتين</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Truck className="w-4 h-4 text-slate-400" />
                                        <span>شحن لجميع المدن</span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Column */}
                            <div className="space-y-5 text-right">
                                <div>
                                    <div className="flex items-center gap-1 text-amber-500 text-xs mb-1.5">
                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        <span className="font-bold">5.0</span>
                                        <span className="text-slate-400 mr-1.5">(18 تقييم متجر موثق)</span>
                                    </div>

                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                                        {quickViewProduct.name}
                                    </h2>

                                    <p className="text-xs text-slate-600 leading-relaxed mt-2">
                                        {quickViewProduct.description || 'منتج أصلي عالي الجودة متوفر للطلب المباشر في المملكة ودول الخليج العربي.'}
                                    </p>
                                </div>

                                {/* Price Box */}
                                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-black text-slate-900 tabular-nums">
                                            {parseFloat(quickViewProduct.price).toFixed(2)} <span className="text-xs font-normal text-slate-500">{currency}</span>
                                        </div>
                                        {quickViewProduct.compare_at_price && (
                                            <div className="text-xs text-slate-400 line-through tabular-nums">
                                                {parseFloat(quickViewProduct.compare_at_price).toFixed(2)} {currency}
                                            </div>
                                        )}
                                        <span className="text-[10px] text-slate-500 block mt-0.5">شامل ضريبة القيمة المضافة 15%</span>
                                    </div>

                                    <div className="text-left">
                                        {quickViewProduct.stock_quantity > 0 ? (
                                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl block">
                                                متوفر: {quickViewProduct.stock_quantity} قطعة
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl block">
                                                نفد من المستودع
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Quantity and Purchase Actions */}
                                {quickViewProduct.stock_quantity > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-slate-700">الكمية:</span>
                                            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                                                <button
                                                    onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))}
                                                    className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-8 text-center font-bold text-xs text-slate-900 tabular-nums">
                                                    {quickViewQty}
                                                </span>
                                                <button
                                                    onClick={() => setQuickViewQty(Math.min(quickViewProduct.stock_quantity || 10, quickViewQty + 1))}
                                                    className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <span className="text-[11px] text-slate-400">
                                                الإجمالي: {(parseFloat(quickViewProduct.price) * quickViewQty).toFixed(2)} {currency}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                            <button
                                                onClick={() => {
                                                    handleAdd(quickViewProduct, quickViewQty);
                                                    setQuickViewProduct(null);
                                                }}
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                                            >
                                                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                                                <span>إضافة للسلة</span>
                                            </button>

                                            <button
                                                onClick={() => handleExpressBuy(quickViewProduct, quickViewQty)}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-700/25 transition"
                                            >
                                                <Zap className="w-4 h-4 fill-white" />
                                                <span>شراء فوري مباشر</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Specs & Delivery Accordion */}
                                <div className="border-t border-slate-100 pt-4 space-y-2">
                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <button
                                            onClick={() => setActiveTab('specs')}
                                            className={`text-xs font-bold pb-1 transition border-b-2 ${
                                                activeTab === 'specs' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            المواصفات
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('shipping')}
                                            className={`text-xs font-bold pb-1 transition border-b-2 ${
                                                activeTab === 'shipping' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            الشحن والتوصيل
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('warranty')}
                                            className={`text-xs font-bold pb-1 transition border-b-2 ${
                                                activeTab === 'warranty' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            الضمان والإرجاع
                                        </button>
                                    </div>

                                    <div className="text-[11px] text-slate-600 leading-relaxed pt-1">
                                        {activeTab === 'specs' && (
                                            <ul className="space-y-1 list-disc list-inside text-slate-600">
                                                <li>رمز المنتج المرجعي: {quickViewProduct.sku}</li>
                                                <li>التصنيف: {quickViewProduct.category?.name || 'عام'}</li>
                                                <li>حالة المنتج: جديد بالكرتون الأصلي 100%</li>
                                                <li>توافق المواصفات: مطابقة لمعايير الهيئة السعودية للمواصفات والمقاييس والجودة (SASO)</li>
                                            </ul>
                                        )}
                                        {activeTab === 'shipping' && (
                                            <p>
                                                يتم الشحن والتوصيل خلال 2 إلى 4 أيام عمل لكافة مناطق ومحافظات المملكة. شحن مجاني للطلبات بقيمة 200 {currency} أو أكثر.
                                            </p>
                                        )}
                                        {activeTab === 'warranty' && (
                                            <p>
                                                ضمان لمدة سنتين ضد عيوب الصناعة مع إمكانية الاستبدال والاسترجاع السلس خلال 14 يوماً من تاريخ استلام الطلب.
                                            </p>
                                        )}
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
