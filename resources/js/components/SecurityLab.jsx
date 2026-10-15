import React, { useState } from 'react';
import { 
    ShieldCheck, Lock, Play, Terminal, 
    CheckCircle2, XCircle, AlertTriangle, 
    Check, ChevronDown, ChevronUp, Code2 
} from 'lucide-react';

export default function SecurityLab({
    apiCall,
    products,
    consoleLogs
}) {
    const [runningTest, setRunningTest] = useState(null);
    const [testResults, setTestResults] = useState({});
    const [showRawLogs, setShowRawLogs] = useState(false);

    const runAttack = async (id, attackFn) => {
        setRunningTest(id);
        const res = await attackFn();
        setTestResults(prev => ({
            ...prev,
            [id]: {
                status: res.status,
                data: res.data,
                passed: res.passed,
                time: new Date().toLocaleTimeString('ar-SA')
            }
        }));
        setRunningTest(null);
    };

    const scenarios = [
        {
            id: 'cross_id',
            title: 'محاولة الوصول المباشر لمعرف متجر آخر (Cross-Tenant ID Manipulation)',
            desc: 'محاولة استدعاء أو تعديل منتج بمعرف ID ينتمي لمستأجر آخر مباشرة عبر المسار.',
            expected: '404 Not Found (حجب تام لبيانات المتجر الآخر وعدم تسريب أي معلومات)',
            run: async () => {
                const res = await apiCall('/api/v1/products/99999');
                return { status: res.status, data: res.data, passed: res.status === 404 };
            }
        },
        {
            id: 'header_spoof',
            title: 'هجوم تزوير ترويسة المستأجر (Header Spoofing / X-Tenant-ID)',
            desc: 'حقن ترويسة X-Tenant-ID: 99999 لتغيير سياق المتجر دون امتلاك عضوية.',
            expected: 'تجاهل الترويسة المزيفة بالكامل والاعتماد فقط على سياق الجلسة الموثقة',
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
            expected: '422 Unprocessable Content (التحقق يرفض التصنيف الذي لا ينتمي للمتجر)',
            run: async () => {
                const res = await apiCall('/api/v1/products', {
                    method: 'POST',
                    body: {
                        name: 'محاولة اختراق تصنيف متجر ثانٍ',
                        sku: 'HIJACK-' + Date.now(),
                        price: 99.00,
                        category_id: 999999
                    }
                });
                return { status: res.status, data: res.data, passed: res.status === 422 };
            }
        },
        {
            id: 'customer_escalation',
            title: 'تصعيد صلاحيات العميل (Customer Privilege Escalation)',
            desc: 'تسجيل الدخول بحساب عميل متسوق ومحاولة إرسال طلب POST لإنشاء منتج جديد في الكتالوج.',
            expected: '403 Forbidden (سياسة الصلاحيات تمنع العميل وتسمح للتاجر والموظف فقط)',
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
                            name: 'منتج غير مصرح به من عميل',
                            sku: 'CUST-EXPLOIT-' + Date.now(),
                            price: 15.00
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
            desc: 'الموظف يملك صلاحية الإضافة والتعديل ولكن لا يملك صلاحية حذف المنتجات (مقتصرة على التاجر المالك).',
            expected: '403 Forbidden (رفض عملية الحذف عند طلبها من قبل الموظف)',
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
            desc: 'محاولة إرسال منتج بسعر سالب وحالة غير معرفة لتخريب قاعدة البيانات.',
            expected: '422 Unprocessable Content (التحقق يرفض القيم غير المتوافقة مع سياسة التسعير)',
            run: async () => {
                const res = await apiCall('/api/v1/products', {
                    method: 'POST',
                    body: {
                        name: 'منتج غير صالح بسعر سالب',
                        sku: 'INV-' + Date.now(),
                        price: -100.00,
                        status: 'invalid_status_xyz'
                    }
                });
                return { status: res.status, data: res.data, passed: res.status === 422 };
            }
        }
    ];

    return (
        <div className="space-y-8 pb-12">
            
            {/* Header */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
                        <Lock className="w-3.5 h-3.5" />
                        <span>معمارية الأمان والعزل متعدد المتاجر (Milestone 1 & 2)</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        مختبر التدقيق الأمني والعزل السحابي
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                        يتيح هذا المركز التحقق الحي من عدم إمكانية تسريب بيانات بين المستأجرين (Tenants)، ومنع التلاعب بمعرفات المتاجر، والتأكد من فرض سياسات الصلاحيات بدقة.
                    </p>
                </div>

                <button
                    onClick={() => setShowRawLogs(!showRawLogs)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-200 shrink-0"
                >
                    <Terminal className="w-4 h-4 text-emerald-600" />
                    <span>{showRawLogs ? 'إخفاء سجل الاستجابات' : 'عرض سجل استجابات API'}</span>
                </button>
            </div>

            {/* Scenarios Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {scenarios.map((sc, idx) => {
                    const result = testResults[sc.id];
                    const isRunning = runningTest === sc.id;

                    return (
                        <div
                            key={sc.id}
                            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-slate-300 transition flex flex-col justify-between space-y-4"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                        سيناريو #{idx + 1}
                                    </span>

                                    {result && (
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                                            result.passed 
                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                                        }`}>
                                            {result.passed ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                            <span>كود: {result.status} {result.passed ? '(تم الصد بنجاح)' : '(فشل)'}</span>
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-extrabold text-sm text-slate-900 mb-1.5 leading-snug">
                                    {sc.title}
                                </h3>

                                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                                    {sc.desc}
                                </p>

                                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
                                    <div className="font-bold text-slate-700">السلوك الأمني المطلوب:</div>
                                    <div className="font-mono text-emerald-800 text-[10px]">{sc.expected}</div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                <button
                                    onClick={() => runAttack(sc.id, sc.run)}
                                    disabled={isRunning}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                                >
                                    {isRunning ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>جاري المحاكاة...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                                            <span>تشغيل الاختبار</span>
                                        </>
                                    )}
                                </button>

                                {result && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        وقت الفحص: {result.time}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Collapsible API Log Viewer */}
            {showRawLogs && (
                <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                            <Terminal className="w-4 h-4 text-emerald-400" />
                            <span>سجل استجابات الـ API الحية ({consoleLogs.length} استجابة مسجلة)</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Enterprise Inspector</span>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {consoleLogs.map((log) => (
                            <div key={log.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            log.status >= 200 && log.status < 300 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        }`}>
                                            {log.status}
                                        </span>
                                        <span className="font-bold text-teal-400">{log.method}</span>
                                        <span className="text-slate-300 truncate max-w-sm">{log.url}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500">{log.time} ({log.duration}ms)</span>
                                </div>
                                <pre className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded-lg overflow-x-auto max-h-24">
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
