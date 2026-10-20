import React, { useState, useEffect } from 'react';
import { 
    Users, Search, RefreshCw, ShoppingCart, 
    Calendar, MapPin, Phone, Mail, ShieldCheck, 
    Award, ArrowUpRight 
} from 'lucide-react';

export default function CustomersManager({
    currentTenant,
    currentUser,
    apiCall,
    showToast
}) {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [totalCustomers, setTotalCustomers] = useState(0);

    const currency = currentTenant?.currency || 'SAR';

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);

            const res = await apiCall(`/api/v1/customers?${params.toString()}`);
            if (res.status === 200 && res.data) {
                setCustomers(res.data.data || []);
                setTotalCustomers(res.data.total_customers || res.data.data?.length || 0);
            } else {
                showToast(res.data?.message || 'تعذر جلب قائمة العملاء', 'error');
            }
        } catch (err) {
            showToast('حدث خطأ أثناء تحميل دليل العملاء', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        loadCustomers();
    };

    return (
        <div className="space-y-6 pb-12">
            
            {/* Header Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                            دليل عملاء المتجر الحصري (M4)
                        </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">سجل وبيانات المتسوقين</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        قائمة موحدة بالعملاء الذين أجروا عمليات شراء في <span className="font-bold text-slate-700">{currentTenant?.name || 'متجرك'}</span>، مع حماية تامة للبيانات والخصوصية.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadCustomers}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>تحديث القائمة</span>
                    </button>
                </div>
            </div>

            {/* Privacy Compliance Banner */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between gap-4 text-xs shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="font-bold text-slate-100">عزل صارم وحماية للخصوصية</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                            يتم استخراج العملاء فقط من طلبات متجرك الحالي. لا يتم مشاركة سجلات العملاء بين المتاجر الأخرى مطلقاً.
                        </div>
                    </div>
                </div>
                <div className="text-left font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl shrink-0">
                    {totalCustomers} عميل مسجل
                </div>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="ابحث باسم العميل، رقم الجوال، البريد الإلكتروني، أو المدينة..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
                    />
                    <button
                        type="submit"
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                    بحث
                </button>
            </form>

            {/* Customers Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                            <span>جاري جلب سجل العملاء المؤكدين...</span>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                            <Users className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="font-bold">لا يوجد عملاء مطابقين لخيارات البحث</p>
                            <p className="text-[11px] text-slate-400">ستظهر بيانات المشترين هنا تلقائياً عند إتمام أي طلب في المتجر</p>
                        </div>
                    ) : (
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                                <tr>
                                    <th className="py-3.5 px-5">اسم العميل</th>
                                    <th className="py-3.5 px-5">رقم الجوال</th>
                                    <th className="py-3.5 px-5">المدينة</th>
                                    <th className="py-3.5 px-5">إجمالي الطلبات</th>
                                    <th className="py-3.5 px-5">إجمالي المشتريات</th>
                                    <th className="py-3.5 px-5">آخر طلب</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {customers.map((c, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                                        <td className="py-4 px-5">
                                            <div className="font-bold text-slate-900">{c.name}</div>
                                            {c.email && (
                                                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                                                    <Mail className="w-3 h-3" />
                                                    <span>{c.email}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-5 font-mono text-slate-700">
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                <span dir="ltr">{c.phone}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-1 text-slate-700">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{c.city || 'غير محدد'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 font-mono font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                                                <ShoppingCart className="w-3 h-3" />
                                                {c.total_orders} {c.total_orders === 1 ? 'طلب' : 'طلبات'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 font-black text-slate-900 tabular-nums">
                                            {parseFloat(c.total_spent || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-normal">{currency}</span>
                                        </td>
                                        <td className="py-4 px-5 text-slate-500 text-[11px] font-mono">
                                            {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('ar-SA') : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
}
