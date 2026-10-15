import React, { useState } from 'react';
import { 
    Zap, X, ShieldAlert, Building2, User, 
    ArrowRight, Lock, Key, Terminal, ExternalLink 
} from 'lucide-react';

export default function DevToolsDrawer({
    currentUser,
    currentTenant,
    onQuickLogin,
    onNavigate,
    activeRoute
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Trigger Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold shadow-2xl border border-slate-700 transition hover:scale-105 active:scale-95"
                    title="أدوات التطوير واختبار الأدوار"
                >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>بيئة التطوير (Dev Tools)</span>
                </button>
            </div>

            {/* Slide-over Drawer */}
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="fixed inset-y-0 right-0 max-w-full flex">
                        <div className="w-screen max-w-sm bg-white border-l border-slate-200 shadow-2xl flex flex-col text-slate-800 animate-in slide-in-from-right duration-200">
                            
                            {/* Header */}
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-sm text-slate-900">أدوات التطوير والاختبار</h3>
                                        <p className="text-[10px] text-slate-500 font-mono">Dev-Only Isolated Panel</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Body Content */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
                                
                                {/* Current Session Diagnostic */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                                        بيانات الجلسة الحالية:
                                    </div>
                                    <div className="space-y-1 font-mono text-[11px]">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">المستخدم:</span>
                                            <span className="font-bold text-slate-800">{currentUser?.name || 'غير مسجل'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">الأدوار:</span>
                                            <span className="text-emerald-700 font-bold">{currentUser?.roles?.join(', ') || 'ضيف'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">المتجر:</span>
                                            <span className="text-slate-700">{currentTenant?.name || 'لا يوجد'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">المسار الحالي:</span>
                                            <span className="text-indigo-600 font-bold">{activeRoute}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Portal Direct Links */}
                                <div className="space-y-2">
                                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                                        الانتقال المباشر بين البوابات الأربع:
                                    </div>
                                    <div className="grid grid-cols-1 gap-1.5 font-medium">
                                        <button
                                            onClick={() => { onNavigate('/platform'); setIsOpen(false); }}
                                            className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-right transition"
                                        >
                                            <span className="font-bold text-slate-800">1. إدارة المنصة (/platform)</span>
                                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">Platform Admin</span>
                                        </button>

                                        <button
                                            onClick={() => { onNavigate('/merchant'); setIsOpen(false); }}
                                            className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-right transition"
                                        >
                                            <span className="font-bold text-slate-800">2. لوحة التاجر (/merchant)</span>
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">Merchant</span>
                                        </button>

                                        <button
                                            onClick={() => { onNavigate('/store/demo-store'); setIsOpen(false); }}
                                            className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-right transition"
                                        >
                                            <span className="font-bold text-slate-800">3. المتجر الإلكتروني (/store)</span>
                                            <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-mono">Customer</span>
                                        </button>

                                        <button
                                            onClick={() => { onNavigate('/account'); setIsOpen(false); }}
                                            className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-right transition"
                                        >
                                            <span className="font-bold text-slate-800">4. حساب العميل (/account)</span>
                                            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-mono">Shopper</span>
                                        </button>

                                        <button
                                            onClick={() => { onNavigate('/security-lab'); setIsOpen(false); }}
                                            className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-right transition"
                                        >
                                            <span className="font-bold text-slate-800">مختبر الأمان والعزل (/security-lab)</span>
                                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono">Audit</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Dev Persona Quick Switcher */}
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                                        تبديل الحسابات التجريبية (عبر API حقيقي):
                                    </div>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        <button
                                            onClick={() => { onQuickLogin('admin@nova.test', 'password'); setIsOpen(false); }}
                                            className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between text-right transition"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-900">مسؤول المنصة (Platform Admin)</div>
                                                <div className="text-[10px] text-slate-400">admin@nova.test</div>
                                            </div>
                                            <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-mono">SuperAdmin</span>
                                        </button>

                                        <button
                                            onClick={() => { onQuickLogin('merchant@nova.test', 'password'); setIsOpen(false); }}
                                            className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between text-right transition"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-900">التاجر (Demo Store Owner)</div>
                                                <div className="text-[10px] text-slate-400">merchant@nova.test</div>
                                            </div>
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">Merchant</span>
                                        </button>

                                        <button
                                            onClick={() => { onQuickLogin('staff@nova.test', 'password'); setIsOpen(false); }}
                                            className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between text-right transition"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-900">موظف المتجر (Staff)</div>
                                                <div className="text-[10px] text-slate-400">staff@nova.test</div>
                                            </div>
                                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono">Staff</span>
                                        </button>

                                        <button
                                            onClick={() => { onQuickLogin('customer@nova.test', 'password'); setIsOpen(false); }}
                                            className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between text-right transition"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-900">عميل متسوق (Customer)</div>
                                                <div className="text-[10px] text-slate-400">customer@nova.test</div>
                                            </div>
                                            <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-mono">Customer</span>
                                        </button>

                                        <button
                                            onClick={() => { onQuickLogin('merchant.beta@nova.test', 'password'); setIsOpen(false); }}
                                            className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between text-right transition"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-900">متجر ثانٍ مستقل (Store Beta)</div>
                                                <div className="text-[10px] text-slate-400">merchant.beta@nova.test</div>
                                            </div>
                                            <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono">StoreBeta</span>
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
