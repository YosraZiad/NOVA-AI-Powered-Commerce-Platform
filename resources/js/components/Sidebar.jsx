import React from 'react';
import { 
    LayoutDashboard, Package, Layers, Store, 
    ShieldCheck, Sparkles, User, LogOut, LogIn, 
    ChevronLeft, CheckCircle2, Building2, ShoppingBag, 
    Sliders, Zap, ShieldAlert, ClipboardList, Boxes, Users, Settings 
} from 'lucide-react';

export default function Sidebar({
    activeView,
    setActiveView,
    currentUser,
    currentTenant,
    onLogout,
    onOpenAuth,
    onNavigate,
    isMobileOpen,
    setIsMobileOpen
}) {
    const isMerchantOrStaff = currentUser?.roles?.some(r => ['Merchant', 'Staff', 'Platform Admin'].includes(r));

    const navItems = [
        {
            id: 'dashboard',
            label: 'لوحة التحكم',
            icon: LayoutDashboard,
            badge: null,
            merchantOnly: true
        },
        {
            id: 'orders',
            label: 'إدارة الطلبات',
            icon: ClipboardList,
            badge: null,
            merchantOnly: true
        },
        {
            id: 'products',
            label: 'كتالوج المنتجات',
            icon: Package,
            badge: null,
            merchantOnly: true
        },
        {
            id: 'categories',
            label: 'إدارة التصنيفات',
            icon: Layers,
            badge: null,
            merchantOnly: true
        },
        {
            id: 'inventory',
            label: 'إدارة المخزون',
            icon: Boxes,
            badge: null,
            merchantOnly: true
        },
        {
            id: 'customers',
            label: 'دليل العملاء',
            icon: Users,
            badge: null,
            merchantOnly: true
        },
        {
            id: 'settings',
            label: 'إعدادات المتجر',
            icon: Settings,
            badge: null,
            merchantOnly: true
        },
        {
            id: 'security_lab',
            label: 'مختبر الأمان والعزل',
            icon: ShieldCheck,
            badge: 'M1 / M2',
            merchantOnly: false
        }
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside className={`
                fixed lg:sticky top-0 right-0 z-40 h-screen w-72 bg-slate-900 text-slate-100 border-l border-slate-800/80 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
                
                {/* Brand & Store Context */}
                <div className="p-5 border-b border-slate-800/80 space-y-4">
                    
                    {/* Brand */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-900/30">
                                ن
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-base tracking-tight text-white">نوفـا</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                                        NOVA
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400">منصة التجارة السحابية الذكية</p>
                            </div>
                        </div>

                        <span className="text-[10px] font-mono font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/60">
                            v2.4
                        </span>
                    </div>

                    {/* Active Tenant Context Card */}
                    {currentTenant ? (
                        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/70 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">نطاق المتجر الحالي</span>
                                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    معزول سحابياً
                                </span>
                            </div>
                            <div className="font-bold text-sm text-white truncate flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>{currentTenant.name}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                                <span>العملة: <span className="text-white font-mono font-bold">{currentTenant.currency || 'SAR'}</span></span>
                                <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                                    ID: #{currentTenant.id}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40 text-center">
                            <p className="text-xs text-slate-400">لا يوجد متجر محدد حالياً</p>
                        </div>
                    )}

                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        القائمة الرئيسية
                    </div>

                    <div className="space-y-1">
                        {navItems.map((item) => {
                            if (item.merchantOnly && !isMerchantOrStaff) return null;

                            const Icon = item.icon;
                            const isActive = activeView === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveView(item.id);
                                        setIsMobileOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-right
                                        ${isActive 
                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40' 
                                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                        <span>{item.label}</span>
                                    </div>

                                    {item.badge && (
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                            isActive 
                                                ? 'bg-emerald-700/80 text-white' 
                                                : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                                        }`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Storefront Customer View Link */}
                    <div className="pt-2 border-t border-slate-800/80">
                        <button
                            onClick={() => {
                                if (onNavigate) {
                                    onNavigate(`/store/${currentTenant?.slug || 'demo-store'}`);
                                } else {
                                    setActiveView('storefront');
                                }
                                setIsMobileOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition text-right"
                        >
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                                <span>معاينة متجر العملاء</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                                عرض حي
                            </span>
                        </button>
                    </div>

                    {/* Platform Admin Quick Link if authorized */}
                    {currentUser?.roles?.includes('Platform Admin') && (
                        <div className="pt-1">
                            <button
                                onClick={() => {
                                    if (onNavigate) {
                                        onNavigate('/platform');
                                    }
                                    setIsMobileOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition text-right"
                            >
                                <div className="flex items-center gap-3">
                                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                                    <span>بوابة إدارة المنصة</span>
                                </div>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300">
                                    Platform
                                </span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer User Profile & Actions */}
                <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
                    {currentUser ? (
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                                    {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-xs text-white truncate">{currentUser.name}</div>
                                    <div className="text-[10px] text-emerald-400 font-mono">
                                        {currentUser.roles?.join(', ') || 'Customer'}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onLogout}
                                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                title="تسجيل الخروج"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onOpenAuth}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>تسجيل الدخول / فتح متجر</span>
                        </button>
                    )}
                </div>

            </aside>
        </>
    );
}
