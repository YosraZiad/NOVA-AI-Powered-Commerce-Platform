import React, { useState } from 'react';
import { 
    Store, ShoppingBag, User, LogIn, ChevronDown, 
    Sparkles, Search, Layers, X, Menu, Phone, 
    ShieldCheck, Truck, CreditCard, RotateCcw, 
    Check, ArrowRight, ExternalLink, HelpCircle
} from 'lucide-react';
import CustomerStorefront from './CustomerStorefront';

export default function StorefrontLayout({
    storeSlug,
    currentTenant,
    products,
    categories,
    loading,
    cart,
    addToCart,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    currentUser,
    onNavigate,
    setIsCartOpen,
    setIsAuthModalOpen,
    onSwitchStore,
    onOpenCheckout
}) {
    const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    
    const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
    const currency = currentTenant?.currency || 'SAR';

    const handleCategoryClick = (catId) => {
        setSelectedCategory(catId);
        setIsMobileNavOpen(false);
        // Smooth scroll to catalog section
        const catalogEl = document.getElementById('store-catalog-section');
        if (catalogEl) {
            catalogEl.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900" dir="rtl">
            
            {/* 1. TOP ANNOUNCEMENT BAR (Saudi & GCC Standard Retail Notice) */}
            <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full text-[11px] border border-emerald-800/60">
                            <Sparkles className="w-3 h-3" />
                            شحن مجاني
                        </span>
                        <span className="text-[11px] sm:text-xs text-slate-300">
                            توصيل مجاني للطلبات بقيمة 200 {currency} وأكثر لجميع مدن المملكة العربية السعودية ودول الخليج.
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-6 text-[11px] text-slate-300 shrink-0">
                        <span className="flex items-center gap-1.5 hover:text-white transition cursor-default">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>منتجات أصلية 100%</span>
                        </span>
                        <span className="text-slate-700">•</span>
                        <span className="flex items-center gap-1.5 hover:text-white transition cursor-default">
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                            <span>إرجاع واستبدال مرن</span>
                        </span>
                        <span className="text-slate-700">•</span>
                        <a 
                            href="tel:8006682" 
                            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition font-mono font-bold"
                            dir="ltr"
                        >
                            <Phone className="w-3 h-3" />
                            <span>800-NOVA-CARE</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* 2. PRIMARY STORE HEADER */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Upper Header Row: Brand, Search, User Actions */}
                    <div className="py-3.5 flex items-center justify-between gap-3 sm:gap-6">
                        
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                            aria-label="القائمة"
                        >
                            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                        {/* Brand / Store Logo */}
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => {
                                    setSelectedCategory('');
                                    setSearch('');
                                    onNavigate(`/store/${currentTenant?.slug || 'demo-store'}`);
                                }}
                                className="flex items-center gap-3 text-right focus:outline-none group"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center font-black text-white text-lg shadow-sm shadow-emerald-700/25 group-hover:scale-105 transition">
                                    <Store className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                                            {currentTenant?.name || 'متجر نوفا'}
                                        </h1>
                                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                            {currency}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                                        المتجر الإلكتروني المعتمد
                                    </p>
                                </div>
                            </button>

                            {/* Store Switcher for shoppers / multi-store testing */}
                            <div className="relative hidden xl:block mr-2">
                                <button
                                    onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition"
                                >
                                    <span>المتاجر</span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isStoreMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isStoreMenuOpen && (
                                    <div 
                                        className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                                        onClick={() => setIsStoreMenuOpen(false)}
                                    >
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            المتاجر المتاحة على المنصة:
                                        </div>
                                        <button
                                            onClick={() => onSwitchStore('merchant@nova.test', 'demo-store')}
                                            className="w-full text-right p-2.5 rounded-xl text-xs hover:bg-slate-50 flex items-center justify-between transition"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-900">Demo Store</div>
                                                <div className="text-[10px] text-slate-400">SAR • متجر تجريبي رئيسي</div>
                                            </div>
                                            {currentTenant?.slug === 'demo-store' && (
                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => onSwitchStore('merchant.beta@nova.test', 'beta-store')}
                                            className="w-full text-right p-2.5 rounded-xl text-xs hover:bg-slate-50 flex items-center justify-between transition"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-900">Store Beta</div>
                                                <div className="text-[10px] text-slate-400">EUR • متجر بيتا المستقل</div>
                                            </div>
                                            {currentTenant?.slug === 'beta-store' && (
                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search Input Bar (Prominent in Header) */}
                        <div className="flex-1 max-w-xl mx-2 hidden md:block">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="ابحث عن المنتجات بالاسم، الفئة، أو الرمز..."
                                    className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 rounded-2xl pr-10 pl-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-2xs"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* User Actions: Cart, Account, Login */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            
                            {/* Shopping Cart Button */}
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative flex items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-200 rounded-2xl text-xs font-bold text-slate-800 hover:text-emerald-900 transition shadow-2xs group"
                                title="سلة المشتريات"
                            >
                                <div className="relative">
                                    <ShoppingBag className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white font-mono font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                                            {cartCount}
                                        </span>
                                    )}
                                </div>
                                <span className="hidden sm:inline">السلة</span>
                                {cartCount > 0 && (
                                    <span className="hidden lg:inline text-[11px] font-mono text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
                                        {cartTotal.toFixed(0)} {currency}
                                    </span>
                                )}
                            </button>

                            {/* Customer Account or Login */}
                            {currentUser ? (
                                <button
                                    onClick={() => onNavigate('/account')}
                                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-800 transition"
                                >
                                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                                        {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                                    </div>
                                    <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-2xl text-xs font-bold transition shadow-xs shadow-emerald-700/20"
                                >
                                    <LogIn className="w-3.5 h-3.5" />
                                    <span>تسجيل الدخول</span>
                                </button>
                            )}

                        </div>

                    </div>

                    {/* Lower Navigation Rail: Direct Category Links (Desktop) */}
                    <div className="hidden lg:flex items-center gap-1 py-2.5 border-t border-slate-100 text-xs overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => handleCategoryClick('')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                                selectedCategory === ''
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>جميع المنتجات ({products.length})</span>
                        </button>

                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.id.toString())}
                                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                                    selectedCategory === cat.id.toString()
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Mobile Navigation Drawer */}
                    {isMobileNavOpen && (
                        <div className="lg:hidden border-t border-slate-100 py-4 space-y-4 animate-in slide-in-from-top-2 duration-150">
                            {/* Mobile Search */}
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="ابحث عن المنتجات..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            {/* Mobile Categories */}
                            <div className="space-y-1">
                                <div className="text-[11px] font-bold text-slate-400 px-2 uppercase">التصنيفات</div>
                                <button
                                    onClick={() => handleCategoryClick('')}
                                    className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition ${
                                        selectedCategory === '' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    جميع المنتجات ({products.length})
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategoryClick(cat.id.toString())}
                                        className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition ${
                                            selectedCategory === cat.id.toString() ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>

                            {/* Mobile Extra Links */}
                            <div className="border-t border-slate-100 pt-3 space-y-2">
                                <button
                                    onClick={() => {
                                        setIsMobileNavOpen(false);
                                        onNavigate('/account');
                                    }}
                                    className="w-full text-right px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                                >
                                    <span>حساب العميل وسجل الطلبات</span>
                                    <ArrowRight className="w-3.5 h-3.5 rotate-180 text-slate-400" />
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </header>

            {/* 3. MAIN STOREFRONT BODY */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <CustomerStorefront
                    products={products}
                    categories={categories}
                    currentTenant={currentTenant}
                    loading={loading}
                    addToCart={addToCart}
                    search={search}
                    setSearch={setSearch}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortDir={sortDir}
                    setSortDir={setSortDir}
                    onOpenCheckout={onOpenCheckout}
                />
            </main>

            {/* 4. COMPREHENSIVE SAUDI & GCC RETAIL FOOTER */}
            <footer className="border-t border-slate-200/90 bg-white text-slate-600 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                        
                        {/* Col 1: Store Bio & Legal Verification */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-base shadow-xs">
                                    <Store className="w-4 h-4" />
                                </div>
                                <span className="font-black text-base text-slate-900">
                                    {currentTenant?.name || 'متجر نوفا'}
                                </span>
                            </div>
                            
                            <p className="text-xs text-slate-500 leading-relaxed">
                                {currentTenant?.description || 'وجهتك الأولى للتسوق الإلكتروني الراقي في المملكة العربية السعودية والخليج. نضمن لك جودة المنتجات، الدفع الآمن، والتوصيل السريع إلى باب منزلك.'}
                            </p>

                            <div className="space-y-1.5 pt-2 text-[11px] text-slate-500">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>سجل تجاري معتمد: 1010784920</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>الرقم الضريبي الموحد: 310892401800003</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>موثق لدى المركز السعودي للأعمال</span>
                                </div>
                            </div>
                        </div>

                        {/* Col 2: Categories */}
                        <div className="space-y-3">
                            <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
                                أقسام المتجر
                            </h4>
                            <ul className="space-y-2 text-xs">
                                <li>
                                    <button 
                                        onClick={() => handleCategoryClick('')}
                                        className="hover:text-emerald-700 transition"
                                    >
                                        جميع المنتجات
                                    </button>
                                </li>
                                {categories.map((c) => (
                                    <li key={c.id}>
                                        <button 
                                            onClick={() => handleCategoryClick(c.id.toString())}
                                            className="hover:text-emerald-700 transition"
                                        >
                                            {c.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Col 3: Customer Care & Policies */}
                        <div className="space-y-3">
                            <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
                                خدمة العملاء والضمانات
                            </h4>
                            <ul className="space-y-2 text-xs text-slate-600">
                                <li className="hover:text-emerald-700 transition cursor-pointer">
                                    سياسة الاستبدال والاسترجاع (14 يوماً)
                                </li>
                                <li className="hover:text-emerald-700 transition cursor-pointer">
                                    الشحن والتوصيل لجميع مناطق المملكة
                                </li>
                                <li className="hover:text-emerald-700 transition cursor-pointer">
                                    ضمان المنتجات الذهبي والأصالة 100%
                                </li>
                                <li className="hover:text-emerald-700 transition cursor-pointer">
                                    الأسئلة الشائعة وإرشادات الطلب
                                </li>
                                <li>
                                    <button 
                                        onClick={() => onNavigate('/account')}
                                        className="hover:text-emerald-700 transition font-semibold"
                                    >
                                        تتبع الطلب وحساب العميل
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Col 4: Payment Badges & Contact */}
                        <div className="space-y-4">
                            <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
                                وسائل الدفع المعتمدة
                            </h4>

                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
                                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 text-slate-800">
                                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>مدى mada</span>
                                    </div>
                                    <div className="p-2 bg-slate-900 border border-slate-900 rounded-xl flex items-center justify-center gap-1.5 text-white">
                                        <span> Apple Pay</span>
                                    </div>
                                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 text-slate-800">
                                        <span>فيزا / ماستر</span>
                                    </div>
                                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 text-slate-800">
                                        <span>الدفع بالاستلام</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-normal">
                                    بوابة الدفع مشفرة بأحدث بروتوكولات الأمان المصرفي 256-bit SSL.
                                </p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                                <div className="font-bold text-slate-800">مركز خدمة العملاء:</div>
                                <div className="text-slate-500 font-mono" dir="ltr">support@nova-commerce.sa</div>
                                <div className="text-slate-500 font-mono font-bold text-emerald-700" dir="ltr">800-NOVA-CARE</div>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Copyright & Tech Attribution */}
                    <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                        <div>
                            جميع الحقوق محفوظة © {new Date().getFullYear()} <span className="font-bold text-slate-800">{currentTenant?.name || 'متجر نوفا'}</span>.
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>مدعوم بنظام التجارة السحابية الذكية</span>
                            <span className="font-mono font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">NOVA Commerce</span>
                        </div>
                    </div>

                </div>
            </footer>

        </div>
    );
}
