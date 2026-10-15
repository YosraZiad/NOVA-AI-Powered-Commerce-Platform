import React, { useState } from 'react';
import { 
    Store, ShoppingBag, LayoutDashboard, ShieldCheck, 
    User, LogOut, LogIn, ChevronDown, Sparkles, ShoppingCart, 
    Layers, RefreshCw 
} from 'lucide-react';

export default function Navbar({ 
    activeView, 
    setActiveView, 
    currentUser, 
    currentTenant, 
    cartCount, 
    setIsCartOpen, 
    setIsAuthModalOpen, 
    handleLogout, 
    handleQuickLogin,
    loading 
}) {
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

    const isMerchantOrStaff = currentUser?.roles?.some(r => ['Merchant', 'Staff', 'Platform Admin'].includes(r));

    return (
        <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setActiveView('storefront')}
                            className="flex items-center gap-3 text-right focus:outline-none group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/25 text-xl tracking-wider group-hover:scale-105 transition">
                                N
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-lg text-white tracking-tight">NOVA</span>
                                    <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                                        Commerce
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium">منصة المتاجر الذكية متعددة المستأجرين</p>
                            </div>
                        </button>

                        {/* Navigation Tabs */}
                        <nav className="hidden md:flex items-center gap-1.5 mr-4">
                            <button
                                onClick={() => setActiveView('storefront')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                                    activeView === 'storefront'
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                                }`}
                            >
                                <ShoppingBag className="w-4 h-4" />
                                <span>واجهة المتجر (العملاء)</span>
                            </button>

                            <button
                                onClick={() => setActiveView('dashboard')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                                    activeView === 'dashboard'
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                                }`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>لوحة تحكم التاجر</span>
                                {isMerchantOrStaff && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                )}
                            </button>

                            <button
                                onClick={() => setActiveView('security_lab')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                                    activeView === 'security_lab'
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                                }`}
                            >
                                <ShieldCheck className="w-4 h-4" />
                                <span>مختبر الأمان والعزل</span>
                                <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                                    M1/M2
                                </span>
                            </button>
                        </nav>
                    </div>

                    {/* Right Side: Store Badge, Switcher, Cart, User Auth */}
                    <div className="flex items-center gap-3">
                        
                        {/* Current Store Badge */}
                        {currentTenant && (
                            <div className="hidden lg:flex items-center gap-2 bg-slate-800/70 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs">
                                <Store className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-slate-400">المتجر:</span>
                                <span className="font-bold text-slate-200">{currentTenant.name}</span>
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded text-[10px] font-mono">
                                    {currentTenant.currency || 'USD'}
                                </span>
                            </div>
                        )}

                        {/* Quick Demo Switcher Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                                className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                                title="تبديل فوري لتجربة الأدوار والمتاجر"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span className="hidden sm:inline">أدوار تجريبية</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isSwitcherOpen && (
                                <div 
                                    className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                                    onClick={() => setIsSwitcherOpen(false)}
                                >
                                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 mb-1">
                                        تسجيل دخول فوري للتجربة:
                                    </div>
                                    <button 
                                        onClick={() => handleQuickLogin('merchant@nova.test', 'password')}
                                        className="w-full text-right px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center justify-between transition"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>👔</span>
                                            <div>
                                                <div className="font-bold">التاجر (Demo Store)</div>
                                                <div className="text-[10px] text-slate-400">merchant@nova.test</div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">Owner</span>
                                    </button>
                                    <button 
                                        onClick={() => handleQuickLogin('staff@nova.test', 'password')}
                                        className="w-full text-right px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-amber-600/20 hover:text-amber-300 flex items-center justify-between transition"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>👷</span>
                                            <div>
                                                <div className="font-bold">موظف المتجر (Staff)</div>
                                                <div className="text-[10px] text-slate-400">staff@nova.test</div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">Staff</span>
                                    </button>
                                    <button 
                                        onClick={() => handleQuickLogin('customer@nova.test', 'password')}
                                        className="w-full text-right px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-emerald-600/20 hover:text-emerald-300 flex items-center justify-between transition"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>🛒</span>
                                            <div>
                                                <div className="font-bold">عميل متسوق (Customer)</div>
                                                <div className="text-[10px] text-slate-400">customer@nova.test</div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">Client</span>
                                    </button>
                                    <div className="my-1 border-t border-slate-800"></div>
                                    <button 
                                        onClick={() => handleQuickLogin('merchant.beta@nova.test', 'password')}
                                        className="w-full text-right px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 flex items-center justify-between transition"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>🏬</span>
                                            <div>
                                                <div className="font-bold">متجر ثانٍ مستقل (Store Beta)</div>
                                                <div className="text-[10px] text-slate-400">merchant.beta@nova.test</div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">Isolated</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Shopping Cart Button */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative bg-slate-800/90 hover:bg-slate-700 border border-slate-700 p-2 rounded-xl text-slate-200 transition"
                            title="سلة المشتريات"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {/* User Profile or Login Button */}
                        {currentUser ? (
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-2 bg-slate-800/70 border border-slate-700/60 pl-3 pr-2.5 py-1.5 rounded-xl text-xs">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 font-bold flex items-center justify-center text-xs">
                                        {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-200 text-xs leading-none">{currentUser.name}</div>
                                        <div className="text-[10px] text-indigo-400 mt-0.5 leading-none">
                                            {currentUser.roles?.join(', ') || 'Customer'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                                    title="تسجيل الخروج"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">خروج</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>دخول / تسجيل</span>
                            </button>
                        )}

                    </div>
                </div>

                {/* Mobile Navigation Tabs Bar */}
                <div className="flex md:hidden items-center justify-around py-2.5 border-t border-slate-800 text-xs font-bold">
                    <button
                        onClick={() => setActiveView('storefront')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                            activeView === 'storefront' ? 'text-indigo-400 bg-indigo-600/10' : 'text-slate-400'
                        }`}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span>المتجر</span>
                    </button>
                    <button
                        onClick={() => setActiveView('dashboard')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                            activeView === 'dashboard' ? 'text-indigo-400 bg-indigo-600/10' : 'text-slate-400'
                        }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>لوحة التحكم</span>
                    </button>
                    <button
                        onClick={() => setActiveView('security_lab')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                            activeView === 'security_lab' ? 'text-indigo-400 bg-indigo-600/10' : 'text-slate-400'
                        }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>الأمان</span>
                    </button>
                </div>

            </div>
        </header>
    );
}
