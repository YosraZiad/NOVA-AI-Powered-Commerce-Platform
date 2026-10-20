import React from 'react';
import { 
    Menu, ShoppingBag, Plus, Bell, Search, 
    ExternalLink, Store, Sparkles, CheckCircle2 
} from 'lucide-react';

export default function Header({
    activeView,
    setActiveView,
    currentTenant,
    cartCount,
    setIsCartOpen,
    onOpenAddProduct,
    setIsMobileOpen,
    onNavigate
}) {
    const titles = {
        dashboard: { title: 'لوحة التحكم والمؤشرات', breadcrumb: 'الرئيسية / المؤشرات' },
        orders: { title: 'إدارة طلبات المتجر والمبيعات', breadcrumb: 'الرئيسية / الطلبات' },
        products: { title: 'كتالوج المنتجات والمخزون', breadcrumb: 'الرئيسية / المنتجات' },
        categories: { title: 'إدارة وتصنيف الكتالوج', breadcrumb: 'الرئيسية / التصنيفات' },
        inventory: { title: 'إدارة وتتبع مستويات المخزون', breadcrumb: 'الرئيسية / المخزون' },
        customers: { title: 'دليل عملاء وسجلات المتجر', breadcrumb: 'الرئيسية / العملاء' },
        settings: { title: 'إعدادات وهوية المتجر وسياساته', breadcrumb: 'الرئيسية / الإعدادات' },
        security_lab: { title: 'مختبر الأمان وعزل المتاجر', breadcrumb: 'الأمان / Multi-Tenancy' }
    };

    const currentMeta = titles[activeView] || titles.dashboard;
    const currency = currentTenant?.currency || 'SAR';

    return (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
            <div className="flex items-center justify-between gap-4">
                
                {/* Left side: Hamburger (mobile) + Breadcrumbs & Page Title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div>
                        <div className="text-[11px] font-semibold text-slate-600 mb-0.5">
                            {currentMeta.breadcrumb}
                        </div>
                        <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                            {currentMeta.title}
                        </h1>
                    </div>
                </div>

                {/* Right side: Actions, Currency, Cart, Quick Add */}
                <div className="flex items-center gap-3">
                    
                    {/* Store badge */}
                    {currentTenant && (
                        <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-slate-500">المتجر:</span>
                            <span className="font-bold text-slate-800">{currentTenant.name}</span>
                            <span className="bg-emerald-50 text-emerald-700 font-mono font-bold text-[10px] px-1.5 py-0.2 rounded border border-emerald-200">
                                {currency}
                            </span>
                        </div>
                    )}

                    {/* View Storefront Quick Link */}
                    <button
                        onClick={() => {
                            if (onNavigate) {
                                onNavigate(`/store/${currentTenant?.slug || 'demo-store'}`);
                            } else {
                                setActiveView('storefront');
                            }
                        }}
                        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-xs"
                        title="معاينة واجهة المتجر كما يراها المشتري"
                    >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>معاينة المتجر</span>
                    </button>

                    {/* Shopping Cart Button */}
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative p-2 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-xs"
                        title="سلة المشتريات"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white font-mono font-bold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    {/* Quick Add Product Button */}
                    {onOpenAddProduct && (
                        <button
                            onClick={onOpenAddProduct}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-700/20 active:scale-98"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة منتج</span>
                        </button>
                    )}

                </div>

            </div>
        </header>
    );
}
