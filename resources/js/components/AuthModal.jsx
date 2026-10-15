import React, { useState } from 'react';
import { 
    X, Lock, Mail, User, Phone, Store, 
    CheckCircle2, AlertCircle, Sparkles, LogIn, 
    ShoppingBag, Building2, UserPlus, ArrowRight 
} from 'lucide-react';

export default function AuthModal({ 
    isOpen, 
    onClose, 
    onLoginSuccess 
}) {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [role, setRole] = useState('Customer'); // 'Customer' | 'Merchant'

    // Login Form State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register Form State
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regTenantName, setRegTenantName] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regPasswordConf, setRegPasswordConf] = useState('');

    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    // Handle Login Submit
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSubmitting(true);

        try {
            const res = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword
                })
            });

            const data = await res.json();

            if (res.ok && data.token) {
                onLoginSuccess(data.token, data.user);
                onClose();
            } else {
                setErrorMsg(data.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
            }
        } catch (err) {
            setErrorMsg('تعذر الاتصال بالخادم: ' + err.message);
        }

        setSubmitting(false);
    };

    // Handle Register Submit
    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (regPassword !== regPasswordConf) {
            setErrorMsg('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
            return;
        }

        setSubmitting(true);

        const payload = {
            name: regName.trim(),
            email: regEmail.trim(),
            phone: regPhone.trim() || undefined,
            password: regPassword,
            password_confirmation: regPasswordConf,
            role: 'Customer'
        };

        try {
            const res = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok && data.token) {
                setSuccessMsg('تم إنشاء الحساب بنجاح! جاري توجيهك...');
                setTimeout(() => {
                    onLoginSuccess(data.token, data.user);
                    onClose();
                }, 900);
            } else {
                const errors = data.errors ? Object.values(data.errors).flat().join(' | ') : data.message;
                setErrorMsg(errors || 'فشل إنشاء الحساب، يرجى التحقق من المدخلات');
            }
        } catch (err) {
            setErrorMsg('تعذر الاتصال بالخادم: ' + err.message);
        }

        setSubmitting(false);
    };

    const fillQuickLogin = (email, pass) => {
        setLoginEmail(email);
        setLoginPassword(pass);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div 
                className="bg-white rounded-3xl border border-slate-200 max-w-md w-full shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150 text-slate-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/60 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-5 left-5 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                            ن
                        </div>
                        <span className="font-extrabold text-sm text-slate-900">نوفا للتجارة الذكية</span>
                    </div>

                    <h2 className="text-xl font-black text-slate-900">
                        {mode === 'login' ? 'تسجيل الدخول إلى حسابك' : 'إنشاء حساب جديد بالمنصة'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        {mode === 'login'
                            ? 'أدخل بيانات الاعتماد للوصول إلى لوحة التحكم أو المتجر'
                            : 'انضم كعميل متسوق أو سجّل كتاجر لإنشاء متجرك المستقل'}
                    </p>

                    {/* Mode Toggle Tabs */}
                    <div className="grid grid-cols-2 gap-1 bg-slate-200/70 p-1 rounded-xl mt-5">
                        <button
                            type="button"
                            onClick={() => { setMode('login'); setErrorMsg(''); }}
                            className={`py-2 rounded-lg text-xs font-bold transition ${
                                mode === 'login'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            تسجيل الدخول
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('register'); setErrorMsg(''); }}
                            className={`py-2 rounded-lg text-xs font-bold transition ${
                                mode === 'register'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            حساب جديد
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <div className="p-6 sm:p-8 space-y-5">
                    
                    {/* Alerts */}
                    {errorMsg && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Mode: Login */}
                    {mode === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        required
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        placeholder="merchant@nova.test"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="password"
                                        required
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-700/20 transition disabled:opacity-50 mt-2"
                            >
                                {submitting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <LogIn className="w-4 h-4" />
                                        <span>تسجيل الدخول</span>
                                    </>
                                )}
                            </button>

                            {/* Demo Quick Logins */}
                            <div className="pt-4 border-t border-slate-100">
                                <span className="block text-[11px] font-bold text-slate-500 mb-2">تعبئة سريعة للحسابات التجريبية:</span>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <button
                                        type="button"
                                        onClick={() => fillQuickLogin('merchant@nova.test', 'password')}
                                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-xl text-slate-700 text-right truncate font-medium"
                                    >
                                        التاجر (Demo Store)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fillQuickLogin('customer@nova.test', 'password')}
                                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-xl text-slate-700 text-right truncate font-medium"
                                    >
                                        العميل (Customer)
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        /* Mode: Register */
                        <form onSubmit={handleRegister} className="space-y-4">
                            
                            {/* Customer Registration Context */}
                            <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-2xl flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-emerald-950">إنشاء حساب عميل متسوق</div>
                                    <div className="text-[11px] text-emerald-700">لتتبع الطلبات، وتسهيل الدفع، وحفظ عناوين الشحن المفضلة.</div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم بالكامل</label>
                                <input
                                    type="text"
                                    required
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                    placeholder="سلطان القحطاني"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    required
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
                                    <input
                                        type="password"
                                        required
                                        value={regPassword}
                                        onChange={(e) => setRegPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">تأكيد كلمة المرور</label>
                                    <input
                                        type="password"
                                        required
                                        value={regPasswordConf}
                                        onChange={(e) => setRegPasswordConf(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-700/20 transition disabled:opacity-50 mt-4"
                            >
                                {submitting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        <span>إنشاء الحساب ومتابعة الاستخدام</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}
