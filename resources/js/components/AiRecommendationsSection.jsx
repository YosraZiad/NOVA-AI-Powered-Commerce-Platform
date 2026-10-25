import React, { useState, useEffect } from 'react';
import { 
    Sparkles, ShoppingBag, Eye, Check, Star, ArrowLeft, 
    Zap, Tag, ShieldCheck, ChevronRight
} from 'lucide-react';
import axios from 'axios';

export default function AiRecommendationsSection({
    tenantSlug,
    currentTenant,
    productId = null,
    categoryId = null,
    intent = 'trending',
    title = null,
    limit = 4,
    onAddToCart,
    onQuickView
}) {
    const [recommendations, setRecommendations] = useState([]);
    const [headline, setHeadline] = useState(title);
    const [loading, setLoading] = useState(true);
    const [addedIds, setAddedIds] = useState([]);

    const currency = currentTenant?.currency || 'SAR';

    useEffect(() => {
        let isMounted = true;

        const fetchRecommendations = async () => {
            if (!tenantSlug) return;
            setLoading(true);
            try {
                const params = {
                    intent: productId && intent === 'trending' ? 'similar' : intent,
                    limit: limit
                };
                if (productId) params.product_id = productId;
                if (categoryId) params.category_id = categoryId;

                const response = await axios.get(`/api/v1/storefront/${tenantSlug}/ai/recommendations`, {
                    params,
                    headers: { 'Accept': 'application/json' }
                });

                if (isMounted && response.data && response.data.items) {
                    setRecommendations(response.data.items);
                    if (!title && response.data.headline) {
                        setHeadline(response.data.headline);
                    }
                }
            } catch (error) {
                console.error('Failed to load AI recommendations:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchRecommendations();

        return () => {
            isMounted = false;
        };
    }, [tenantSlug, productId, categoryId, intent, limit, title]);

    const handleAdd = (product) => {
        if (onAddToCart) {
            onAddToCart(product, 1);
            setAddedIds(prev => [...prev, product.id]);
            setTimeout(() => {
                setAddedIds(prev => prev.filter(id => id !== product.id));
            }, 2500);
        }
    };

    if (loading) {
        return (
            <div className="py-6 space-y-4" dir="rtl">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-slate-200 rounded-md animate-pulse" />
                    <div className="h-5 w-48 bg-slate-200 rounded-md animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].slice(0, limit).map((n) => (
                        <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 animate-pulse">
                            <div className="h-36 bg-slate-100 rounded-xl" />
                            <div className="h-4 bg-slate-200 rounded w-3/4" />
                            <div className="h-4 bg-slate-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!recommendations || recommendations.length === 0) {
        return null;
    }

    return (
        <section className="py-8 space-y-4" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900">
                            {headline || 'توصيات ذكية مختارة لك'}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                            ترشيحات مخصصة بناءً على توافق المنتجات وتفضيلات المتسوقين
                        </p>
                    </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                    <Zap className="w-3 h-3 text-amber-500" />
                    مدعوم بالذكاء الاصطناعي
                </span>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recommendations.map((item, idx) => {
                    const prod = item.product;
                    const isAdded = addedIds.includes(prod.id);
                    const imageUrl = prod.image_url || prod.images?.[0]?.url || null;

                    return (
                        <div 
                            key={prod.id || idx}
                            className="group bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between gap-3 relative"
                        >
                            {/* Recommendation Reason Pill */}
                            <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                                    <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                    {item.badge || 'موصى به'}
                                </span>
                                {item.score && (
                                    <span className="text-[10px] font-mono text-slate-400">
                                        تطابق {Math.round(item.score * 100)}%
                                    </span>
                                )}
                            </div>

                            {/* Product Thumbnail */}
                            <div 
                                onClick={() => onQuickView && onQuickView(prod)}
                                className="relative aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden cursor-pointer flex items-center justify-center group-hover:scale-[1.01] transition-transform"
                            >
                                {imageUrl ? (
                                    <img 
                                        src={imageUrl} 
                                        alt={prod.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <ShoppingBag className="w-12 h-12 text-slate-300" />
                                )}

                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="bg-white/90 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                                        <Eye className="w-3.5 h-3.5" />
                                        معاينة سريعة
                                    </span>
                                </div>
                            </div>

                            {/* Title & Details */}
                            <div className="space-y-1">
                                <h4 
                                    onClick={() => onQuickView && onQuickView(prod)}
                                    className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 cursor-pointer hover:text-emerald-700 transition" 
                                    title={prod.name}
                                >
                                    {prod.name}
                                </h4>

                                <p className="text-[11px] text-slate-500 line-clamp-1 leading-normal">
                                    {item.reason}
                                </p>

                                <div className="flex items-baseline gap-1.5 pt-1">
                                    <span className="text-sm sm:text-base font-black text-emerald-700">
                                        {parseFloat(prod.price).toFixed(2)}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-600">
                                        {currency}
                                    </span>
                                    {prod.compare_at_price && parseFloat(prod.compare_at_price) > parseFloat(prod.price) && (
                                        <span className="text-[10px] text-slate-400 line-through">
                                            {parseFloat(prod.compare_at_price).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                {onQuickView && (
                                    <button
                                        type="button"
                                        onClick={() => onQuickView(prod)}
                                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition"
                                        title="معاينة المنتج"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleAdd(prod)}
                                    disabled={prod.stock_quantity <= 0 || isAdded}
                                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                                        isAdded 
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : (prod.stock_quantity <= 0 
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs')
                                    }`}
                                >
                                    {isAdded ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>تمت الإضافة!</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                            <span>{prod.stock_quantity <= 0 ? 'نفد المخزون' : 'أضف للسلة'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
