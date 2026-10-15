import React, { useState } from 'react';
import { 
    ShieldAlert, ShieldCheck, Lock, Play, Terminal, 
    CheckCircle2, XCircle, AlertTriangle, ArrowRight, 
    RefreshCw, Code, Check 
} from 'lucide-react';

export default function SecurityLabView({ 
    apiCall, 
    products, 
    consoleLogs 
}) {
    const [runningTest, setRunningTest] = useState(null);
    const [testResults, setTestResults] = useState({});
    const [showRawLogs, setShowRawLogs] = useState(false);

    const runAttack = async (id, title, attackFn) => {
        setRunningTest(id);
        const res = await attackFn();
        setTestResults(prev => ({
            ...prev,
            [id]: {
                status: res.status,
                data: res.data,
                passed: res.passed,
                time: new Date().toLocaleTimeString('ar-EG')
            }
        }));
        setRunningTest(null);
    };

    const attacks = [
        {
            id: 'cross_id',
            title: 'محاولة الوصول المباشر لمعرف متجر آخر (Cross-Tenant ID Manipulation)',
            desc: 'يحاول المهاجم جلب أو تعديل منتج بمعرف ID ينتمي لمتجر ثانٍ عبر تلاعب مباشر بالرابط.',
            expected: '404 Not Found (حجب تام لبيانات المتجر الآخر)',
            run: async () => {
                const res = await apiCall('/api/v1/products/99999');
                return { status: res.status, data: res.data, passed: res.status === 404 };
            }
        },
        {
            id: 'header_spoof',
            title: 'هجوم تزوير الترويسة (Header Spoofing / X-Tenant-ID)',
            desc: 'محاولة إرسال ترويسة X-Tenant-ID: 99999 لتجاوز نطاق المتجر المعتمد في الجلسة.',
            expected: 'تجاهل الترويسة المزيفة واعتماد جلسة التاجر الأصلية فقط',
            run: async () => {
                const res = await apiCall('/api/v1/products', {
                    headers: { 'X-Tenant-ID': '99999' }
                });
                return { status: res.status, data: res.data, passed: res.status === 200 };
            }
        },
        {
            id: 'category_hijack',
            title: 'هجوم الاستيلاء على التصنيفات (Cross-Tenant Category Hijacking)',
            desc: 'محاولة إنشاء منتج في المتجر الحالي وربطه بتصنيف يملكه متجر آخر.',
            expected: '422 Unprocessable Content (التحقق يرفض التصنيف الغريب)',
            run: async () => {
                const res = await apiCall('/api/v1/products', {
                    method: 'POST',
                    body: {
                        name: 'اختراق تصنيف متجر ثانٍ',
                        sku: 'HIJACK-' + Date.now(),
                        price: 49.99,
                        category_id: 999999
                    }
                });
                return { status: res.status, data: res.data, passed: res.status === 422 };
            }
        },
        {
            id: 'customer_escalation',
            title: 'تصعيد صلاحيات العميل (Customer Privilege Escalation)',
            desc: 'تسجيل الدخول كعميل متسوق ومحاولة إرسال طلب POST لإنشاء منتج في الكتالوج.',
            expected: '403 Forbidden (سياسة الصلاحيات تمنع العميل)',
            run: async () => {
                const loginRes = await apiCall('/api/v1/auth/login', {
                    method: 'POST',
                    body: { email: 'customer@nova.test', password: 'password' },
                    overrideToken: null
                });
                if (loginRes.data?.token) {
                    const postRes = await apiCall('/api/v1/products', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${loginRes.data.token}` },
                        body: {
                            name: 'منتج غير مصرح من عميل',
                            sku: 'CUST-EXPLOIT-' + Date.now(),
                            price: 10.00
                        }
                    });
                    return { status: postRes.status, data: postRes.data, passed: postRes.status === 403 };
                }
                return { status: 0, data: null, passed: false };
            }
        },
        {
            id: 'staff_deletion',
            title: 'محاولة الموظف حذف منتج (Staff Unauthorized Deletion)',
            desc: 'الموظف يملك صلاحية الإضافة والتعديل ولكن لا يملك صلاحية حذف المنتجات (مقتصرة على التاجر).',
            expected: '403 Forbidden (رفض الحذف من قبل الموظف)',
            run: async () => {
                const loginRes = await apiCall('/api/v1/auth/login', {
                    method: 'POST',
                    body: { email: 'staff@nova.test', password: 'password' },
                    overrideToken: null
                });
                if (loginRes.data?.token) {
                    const prodId = products[0]?.id || 1;
                    const delRes = await apiCall(`/api/v1/products/${prodId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${loginRes.data.token}` }
                    });
                    return { status: delRes.status, data: delRes.data, passed: delRes.status === 403 };
                }
                return { status: 0, data: null, passed: false };
            }
        },
        {
            id: 'data_validation',
            title: 'حماية تكامل البيانات (Negative Price & Invalid Status)',
            desc: 'محاولة إرسال منتج بسعر سالب (-50.00) وحالة غير معرفة لتخريب قاعدة البيانات.',
            expected: '422 Unprocessable Content (التحقق يرفض البيانات الفاسدة)',
            run: async () => {
                const res = await apiCall('/api/v1/products', {
                    method: 'POST',
                    body: {
                        name: 'منتج فاسد بسعر سالب',
                        sku: 'INV-' + Date.now(),
                        price: -50.00,
                        status: 'invalid_status_xyz'
                    }
                });
                return { status: res.status, data: res.data, passed: res.status === 422 };
            }
        }
    ];

    return (
        <div className="space-y-8 pb-16">
            
            {/* Header */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Security & Multi-Tenancy Architecture (M1 / M2)</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">مختبر التحقق من العزل الأمني للمتاجر</h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                        يختبر هذا المعمل سيناريوهات الهجمات الحقيقية والتأكد من صمود العزل البرمجي بين المتاجر وصلاحيات الأدوار بدقة تامة.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowRawLogs(!showRawLogs)}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700"
                    >
                        <Terminal className="w-4 h-4 text-indigo-400" />
                        <span>{showRawLogs ? 'إخفاء سجل API' : 'عرض سجل API'}</span>
                    </button>
                </div>
            </div>

            {/* Test Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {attacks.map((atk, index) => {
                    const result = testResults[atk.id];
                    const isRunning = runningTest === atk.id;

                    return (
                        <div 
                            key={atk.id}
                            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-5 hover:border-slate-700 transition"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                        سيناريو #{index + 1}
                                    </span>

                                    {result && (
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                                            result.passed 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        }`}>
                                            {result.passed ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                            <span>كود: {result.status} {result.passed ? '(تم الصد بنجاح)' : '(فشل)'}</span>
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-bold text-sm text-white mb-2 leading-snug">{atk.title}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed mb-4">{atk.desc}</p>

                                <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl text-[11px] text-slate-300 space-y-1">
                                    <div className="text-slate-500 font-semibold">الاستجابة الأمنية المتوقعة:</div>
                                    <div className="font-mono text-indigo-300">{atk.expected}</div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                                <button
                                    onClick={() => runAttack(atk.id, atk.title, atk.run)}
                                    disabled={isRunning}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
                                >
                                    {isRunning ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>جاري المحاكاة...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                            <span>تشغيل المحاكاة</span>
                                        </>
                                    )}
                                </button>

                                {result && (
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        تم الفحص: {result.time}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Collapsible API Log Console */}
            {showRawLogs && (
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                            <Terminal className="w-4 h-4 text-indigo-400" />
                            <span>سجل استجابات الـ API الحية ({consoleLogs.length} استجابة مسجلة)</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Real-time HTTP Inspector</span>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {consoleLogs.map((log) => (
                            <div key={log.id} className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl text-xs font-mono space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                            log.status >= 200 && log.status < 300 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                            {log.status}
                                        </span>
                                        <span className="font-bold text-indigo-400">{log.method}</span>
                                        <span className="text-slate-300 truncate max-w-xs">{log.url}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500">{log.time} ({log.duration}ms)</span>
                                </div>
                                <pre className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded-lg overflow-x-auto max-h-24">
                                    {JSON.stringify(log.data, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
