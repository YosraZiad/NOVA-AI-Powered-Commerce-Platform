import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, Building2, Users, Activity, 
    CheckCircle2, XCircle, AlertTriangle, RefreshCw, 
    Search, Server, Layers, Package, Lock, ArrowUpRight,
    Plus, X 
} from 'lucide-react';

export default function PlatformAdminPortal({
    currentUser,
    apiCall,
    onNavigate,
    showToast
}) {
    const [tab, setTab] = useState('overview'); // 'overview' | 'tenants' | 'users'
    const [metrics, setMetrics] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTenant, setSearchTenant] = useState('');
    const [updatingTenantId, setUpdatingTenantId] = useState(null);

    // Provision store modal state
    const [isProvisionOpen, setIsProvisionOpen] = useState(false);
    const [provName, setProvName] = useState('');
    const [provSlug, setProvSlug] = useState('');
    const [provCurrency, setProvCurrency] = useState('SAR');
    const [provOwnerName, setProvOwnerName] = useState('');
    const [provOwnerEmail, setProvOwnerEmail] = useState('');
    const [provOwnerPassword, setProvOwnerPassword] = useState('');
    const [provisioning, setProvisioning] = useState(false);

    const isPlatformAdmin = currentUser?.roles?.includes('Platform Admin');

    // Load Platform Admin Data
    const loadPlatformData = async () => {
        setLoading(true);
        
        // 1. Metrics
        const mRes = await apiCall('/api/v1/platform/metrics');
        if (mRes.status === 200 && mRes.data?.metrics) {
            setMetrics(mRes.data.metrics);
        }

        // 2. Tenants
        const tRes = await apiCall('/api/v1/platform/tenants');
        if (tRes.status === 200 && tRes.data?.data) {
            setTenants(tRes.data.data);
        }

        // 3. Users
        const uRes = await apiCall('/api/v1/platform/users');
        if (uRes.status === 200 && uRes.data?.data) {
            setUsers(uRes.data.data);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (isPlatformAdmin) {
            loadPlatformData();
        }
    }, [isPlatformAdmin]);

    // Toggle Tenant Status (Active <-> Suspended)
    const handleToggleStatus = async (tenant) => {
        const nextStatus = tenant.status === 'active' ? 'suspended' : 'active';
        setUpdatingTenantId(tenant.id);

        const res = await apiCall(`/api/v1/platform/tenants/${tenant.id}/status`, {
            method: 'PATCH',
            body: { status: nextStatus }
        });

        if (res.status === 200) {
            showToast?.(`تم تغيير حالة متجر ${tenant.name} إلى ${nextStatus === 'active' ? 'نشط' : 'معلق'}`, 'success');
            await loadPlatformData();
        } else {
            showToast?.('فشل تحديث حالة المتجر', 'error');
        }

        setUpdatingTenantId(null);
    };

    // Provision new store and merchant owner
    const handleProvisionTenant = async (e) => {
        e.preventDefault();
        setProvisioning(true);

        const payload = {
            name: provName,
            slug: provSlug.trim() ? provSlug.trim() : undefined,
            currency: provCurrency,
            owner_name: provOwnerName,
            owner_email: provOwnerEmail,
            owner_password: provOwnerPassword
        };

        const res = await apiCall('/api/v1/platform/tenants', {
            method: 'POST',
            body: payload
        });

        if (res.status === 201) {
            showToast?.('تم توفير وتخصيص المتجر وحساب التاجر بنجاح', 'success');
            setIsProvisionOpen(false);
            setProvName('');
            setProvSlug('');
            setProvCurrency('SAR');
            setProvOwnerName('');
            setProvOwnerEmail('');
            setProvOwnerPassword('');
            await loadPlatformData();
        } else {
            const err = res.data?.errors ? Object.values(res.data.errors).flat().join(' | ') : (res.data?.message || 'فشل توفير المتجر');
            showToast?.(err, 'error');
        }

        setProvisioning(false);
    };

    // If unauthorized, render strict access denied screen
    if (!isPlatformAdmin) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-rose-200 max-w-md w-full p-8 text-center space-y-4 shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">منطقة محظورة (403 Forbidden)</h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        هذه البوابة مخصصة حصرياً لـ <span className="font-bold text-slate-900">مسؤولي المنصة المركزيين (Platform Admin)</span>. لا يمتلك حسابك الحالي الصلاحيات الكافية للوصول لإدارة المتاجر المركزية.
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-3">
                        <button
                            onClick={() => onNavigate('/merchant')}
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                        >
                            الذهاب إلى لوحة التاجر
                        </button>
                        <button
                            onClick={() => onNavigate('/store/demo-store')}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                        >
                            واجهة المتجر
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const filteredTenants = tenants.filter(t => 
        t.name.toLowerCase().includes(searchTenant.toLowerCase()) || 
        t.slug.toLowerCase().includes(searchTenant.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-16">
            
            {/* Header Banner */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>نظام إدارة المنصة المركزي (Platform Admin)</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">إدارة منصة نوفا للتجارة السحابية</h1>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        لوحة التحكم المركزية للإشراف على المستأجرين (Tenants)، متابعة صحة النظام، وإدارة المستخدمين على مستوى المنصة ككل.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadPlatformData}
                        disabled={loading}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700 shrink-0"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
                        <span>تحديث البيانات</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics Cards */}
            {metrics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="text-[11px] font-bold text-slate-500 mb-1">إجمالي المتاجر (Tenants)</div>
                        <div className="text-2xl font-black text-slate-900 tabular-nums">{metrics.total_tenants}</div>
                        <div className="text-[10px] text-emerald-600 font-bold mt-1">مستأجرين مسجلين</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="text-[11px] font-bold text-slate-500 mb-1">المتاجر النشطة</div>
                        <div className="text-2xl font-black text-emerald-700 tabular-nums">{metrics.active_tenants}</div>
                        <div className="text-[10px] text-emerald-600 font-bold mt-1">تعمل وتستقبل طلبات</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="text-[11px] font-bold text-slate-500 mb-1">المتاجر المعلقة</div>
                        <div className="text-2xl font-black text-rose-600 tabular-nums">{metrics.suspended_tenants}</div>
                        <div className="text-[10px] text-rose-500 font-bold mt-1">محجوبة عن العمليات</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="text-[11px] font-bold text-slate-500 mb-1">مستخدمي المنصة</div>
                        <div className="text-2xl font-black text-slate-900 tabular-nums">{metrics.total_users}</div>
                        <div className="text-[10px] text-indigo-600 font-bold mt-1">تجار، موظفين، عملاء</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="text-[11px] font-bold text-slate-500 mb-1">إجمالي المنتجات كلياً</div>
                        <div className="text-2xl font-black text-slate-900 tabular-nums">{metrics.total_products}</div>
                        <div className="text-[10px] text-teal-600 font-bold mt-1">عبر كافة المستأجرين</div>
                    </div>
                </div>
            )}

            {/* Sub-Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
                <button
                    onClick={() => setTab('overview')}
                    className={`px-4 py-2 rounded-xl transition ${
                        tab === 'overview'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    نظرة عامة على النظام
                </button>

                <button
                    onClick={() => setTab('tenants')}
                    className={`px-4 py-2 rounded-xl transition ${
                        tab === 'tenants'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    إدارة المستأجرين والمتاجر ({tenants.length})
                </button>

                <button
                    onClick={() => setTab('users')}
                    className={`px-4 py-2 rounded-xl transition ${
                        tab === 'users'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    دليل المستخدمين والصلاحيات ({users.length})
                </button>
            </div>

            {/* Tab 1: System Overview */}
            {tab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                            <Server className="w-4 h-4 text-emerald-600" />
                            <span>معلومات البيئة والخوادم</span>
                        </h3>
                        <div className="divide-y divide-slate-100 text-xs">
                            <div className="py-2.5 flex justify-between">
                                <span className="text-slate-500 font-medium">حالة المنصة:</span>
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">سليم ونشط (Healthy)</span>
                            </div>
                            <div className="py-2.5 flex justify-between font-mono">
                                <span className="text-slate-500 font-medium font-sans">إصدار PHP:</span>
                                <span className="font-bold text-slate-800">{metrics?.php_version || '8.2'}</span>
                            </div>
                            <div className="py-2.5 flex justify-between font-mono">
                                <span className="text-slate-500 font-medium font-sans">إصدار Laravel:</span>
                                <span className="font-bold text-slate-800">{metrics?.laravel_version || '12.x'}</span>
                            </div>
                            <div className="py-2.5 flex justify-between font-mono">
                                <span className="text-slate-500 font-medium font-sans">نظام عزل البيانات:</span>
                                <span className="font-bold text-slate-800">Multi-Tenancy Single DB / Scoped</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-600" />
                            <span>إجراءات سريعة لمسؤول المنصة</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <button
                                onClick={() => setTab('tenants')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-right font-semibold text-slate-800 transition"
                            >
                                <Building2 className="w-4 h-4 text-emerald-600 mb-1" />
                                <div>استعراض المتاجر المسجلة</div>
                            </button>

                            <button
                                onClick={() => setTab('users')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-right font-semibold text-slate-800 transition"
                            >
                                <Users className="w-4 h-4 text-indigo-600 mb-1" />
                                <div>إدارة المستخدمين والأدوار</div>
                            </button>

                            <button
                                onClick={() => onNavigate('/merchant')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-right font-semibold text-slate-800 transition"
                            >
                                <Package className="w-4 h-4 text-teal-600 mb-1" />
                                <div>معاينة لوحة التاجر</div>
                            </button>

                            <button
                                onClick={() => onNavigate('/store/demo-store')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-right font-semibold text-slate-800 transition"
                            >
                                <ArrowUpRight className="w-4 h-4 text-amber-600 mb-1" />
                                <div>زيارة المتجر كعميل</div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Tenants Management */}
            {tab === 'tenants' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="relative max-w-sm flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTenant}
                                onChange={(e) => setSearchTenant(e.target.value)}
                                placeholder="بحث بالاسم أو النطاق..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div className="flex items-center gap-3 justify-between sm:justify-end">
                            <span className="text-xs text-slate-500 font-semibold">إجمالي: {filteredTenants.length} متاجر</span>
                            <button
                                onClick={() => setIsProvisionOpen(true)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                            >
                                <Plus className="w-4 h-4" />
                                <span>توفير متجر جديد</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200/80">
                                <tr>
                                    <th className="py-3 px-4">اسم المتجر</th>
                                    <th className="py-3 px-4">معرّف النطاق (Slug)</th>
                                    <th className="py-3 px-4">العملة</th>
                                    <th className="py-3 px-4">المستخدمين المرتبطين</th>
                                    <th className="py-3 px-4">إجمالي المنتجات</th>
                                    <th className="py-3 px-4">الحالة</th>
                                    <th className="py-3 px-4 text-center">التحكم المركزي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {filteredTenants.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/60 transition">
                                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{t.name}</span>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-slate-500">{t.slug}</td>
                                        <td className="py-3.5 px-4 font-bold">{t.currency || 'SAR'}</td>
                                        <td className="py-3.5 px-4 tabular-nums">{t.users_count ?? 1}</td>
                                        <td className="py-3.5 px-4 tabular-nums">{t.products_count ?? 0}</td>
                                        <td className="py-3.5 px-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                t.status === 'active' 
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}>
                                                {t.status === 'active' ? 'نشط' : 'معلق'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <button
                                                onClick={() => handleToggleStatus(t)}
                                                disabled={updatingTenantId === t.id}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                                                    t.status === 'active'
                                                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                }`}
                                            >
                                                {updatingTenantId === t.id 
                                                    ? 'جاري التحديث...' 
                                                    : t.status === 'active' ? 'تعليق المتجر' : 'تفعيل المتجر'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 3: Users Oversight */}
            {tab === 'users' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200/80">
                                <tr>
                                    <th className="py-3 px-4">المستخدم</th>
                                    <th className="py-3 px-4">البريد الإلكتروني</th>
                                    <th className="py-3 px-4">الأدوار الممنوحة</th>
                                    <th className="py-3 px-4">المتاجر المرتبطة</th>
                                    <th className="py-3 px-4">الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                                        <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                                        <td className="py-3.5 px-4 font-mono text-slate-500">{u.email}</td>
                                        <td className="py-3.5 px-4">
                                            {u.roles?.map(r => (
                                                <span key={r.id || r.name} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold mr-1">
                                                    {r.name}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-600">
                                            {u.tenants?.length > 0 
                                                ? u.tenants.map(t => t.name).join('، ') 
                                                : <span className="text-slate-400">لا يوجد متجر</span>}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                                {u.status || 'نشط'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Provision Store Modal */}
            {isProvisionOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-sm text-slate-900">توفير متجر جديد وتعيين مالكه</h3>
                                    <p className="text-[11px] text-slate-500">عملية إدارية مركزية محكمة لحجز متجر للعميل وتفعيل حساب التاجر</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsProvisionOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleProvisionTenant} className="space-y-4 text-xs">
                            <div className="space-y-1">
                                <label className="font-bold text-slate-700">اسم المتجر / العلامة التجارية *</label>
                                <input
                                    type="text"
                                    required
                                    value={provName}
                                    onChange={(e) => setProvName(e.target.value)}
                                    placeholder="مثال: متجر رواء للمنتجات الطبيعية"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-700">معرّف النطاق (Slug)</label>
                                    <input
                                        type="text"
                                        value={provSlug}
                                        onChange={(e) => setProvSlug(e.target.value)}
                                        placeholder="اختياري (ينشأ تلقائياً)"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-700">العملة الأساسية *</label>
                                    <select
                                        value={provCurrency}
                                        onChange={(e) => setProvCurrency(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-bold"
                                    >
                                        <option value="SAR">ريال سعودي (SAR)</option>
                                        <option value="AED">درهم إماراتي (AED)</option>
                                        <option value="KWD">دينار كويتي (KWD)</option>
                                        <option value="USD">دولار أمريكي (USD)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                    بيانات مالك المتجر (التاجر المعتمد):
                                </span>

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="font-bold text-slate-700">اسم المالك / التاجر *</label>
                                        <input
                                            type="text"
                                            required
                                            value={provOwnerName}
                                            onChange={(e) => setProvOwnerName(e.target.value)}
                                            placeholder="مثال: عبدالله الشمري"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="font-bold text-slate-700">البريد الإلكتروني للتاجر *</label>
                                        <input
                                            type="email"
                                            required
                                            value={provOwnerEmail}
                                            onChange={(e) => setProvOwnerEmail(e.target.value)}
                                            placeholder="merchant@example.com"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-mono text-left"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="font-bold text-slate-700">كلمة المرور الابتدائية *</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={8}
                                            value={provOwnerPassword}
                                            onChange={(e) => setProvOwnerPassword(e.target.value)}
                                            placeholder="8 خانات على الأقل"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-mono text-left"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsProvisionOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold transition"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={provisioning}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
                                >
                                    {provisioning ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>جاري التوفير والتخصيص...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Building2 className="w-3.5 h-3.5" />
                                            <span>توفير المتجر وتفعيل الحساب</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
