import React, { useState, useEffect } from 'react';
import { 
    ShoppingBag, Search, Filter, RefreshCw, Eye, 
    CheckCircle2, Clock, AlertTriangle, XCircle, 
    Truck, CreditCard, Banknote, User, Phone, 
    MapPin, Calendar, FileText, ChevronRight, X,
    DollarSign, ArrowUpRight, RotateCcw
} from 'lucide-react';

export default function OrdersManager({
    currentTenant,
    currentUser,
    apiCall,
    showToast
}) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, last_page: 1 });
    
    // Details Drawer / Modal
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const currency = currentTenant?.currency || 'SAR';

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            if (paymentFilter) params.append('payment_status', paymentFilter);
            if (page > 1) params.append('page', page);

            const res = await apiCall(`/api/v1/orders?${params.toString()}`);
            if (res.status === 200 && res.data?.data) {
                setOrders(res.data.data);
                if (res.data.meta) {
                    setPagination({
                        total: res.data.meta.total,
                        last_page: res.data.meta.last_page
                    });
                }
            } else {
                setOrders([]);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            showToast?.('حدث خطأ أثناء تحميل الطلبات', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [search, statusFilter, paymentFilter, page]);

    // Handle Order Status Update
    const handleUpdateStatus = async (orderId, newStatus) => {
        setIsUpdatingStatus(true);
        try {
            const res = await apiCall(`/api/v1/orders/${orderId}/status`, {
                method: 'PATCH',
                body: { status: newStatus }
            });

            if (res.status === 200 && res.data?.data) {
                const updated = res.data.data;
                setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder(updated);
                }
                const msg = newStatus === 'cancelled' 
                    ? 'تم إلغاء الطلب واسترجاع كميات المنتجات إلى المخزون تلقائياً.' 
                    : 'تم تحديث حالة الطلب بنجاح.';
                showToast?.(msg, 'success');
            } else {
                showToast?.(res.data?.message || 'فشل تحديث حالة الطلب', 'error');
            }
        } catch (err) {
            console.error('Update status error:', err);
            showToast?.('خطأ أثناء التحديث', 'error');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Handle Payment Status Update
    const handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
        setIsUpdatingStatus(true);
        try {
            const res = await apiCall(`/api/v1/orders/${orderId}/payment-status`, {
                method: 'PATCH',
                body: { payment_status: newPaymentStatus }
            });

            if (res.status === 200 && res.data?.data) {
                const updated = res.data.data;
                setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder(updated);
                }
                showToast?.('تم تحديث حالة الدفع بنجاح.', 'success');
            } else {
                showToast?.(res.data?.message || 'فشل تحديث حالة الدفع', 'error');
            }
        } catch (err) {
            console.error('Update payment error:', err);
            showToast?.('خطأ أثناء التحديث', 'error');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Helper for Status Badges
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        <span>قيد الانتظار</span>
                    </span>
                );
            case 'processing':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Truck className="w-3.5 h-3.5" />
                        <span>قيد التجهيز</span>
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>مكتمل</span>
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ملغي</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        <span>{status}</span>
                    </span>
                );
        }
    };

    // Helper for Payment Status Badges
    const getPaymentBadge = (status) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>مدفوع</span>
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        <span>معلق</span>
                    </span>
                );
            case 'refunded':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <RotateCcw className="w-3 h-3" />
                        <span>مسترجع</span>
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3" />
                        <span>فشل السداد</span>
                    </span>
                );
            default:
                return <span className="text-slate-500 text-xs">{status}</span>;
        }
    };

    // Helper for payment method label
    const getPaymentMethodLabel = (method) => {
        switch (method) {
            case 'mada': return 'مدى / بطاقة بنكية';
            case 'apple_pay': return 'Apple Pay';
            case 'credit_card': return 'بطاقة ائتمان';
            case 'cod': return 'الدفع عند الاستلام (COD)';
            default: return method;
        }
    };

    // Quick Stats
    const totalCount = pagination.total || orders.length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const completedCount = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders
        .filter(o => o.payment?.status === 'paid' || o.status === 'completed')
        .reduce((sum, o) => sum + (o.financials?.total || 0), 0);

    return (
        <div className="space-y-6">
            
            {/* Header with Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-slate-500">إجمالي الطلبات</div>
                        <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{totalCount}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-amber-600">طلبات قيد الانتظار</div>
                        <div className="text-2xl font-black text-amber-700 mt-1 tabular-nums">{pendingCount}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-blue-600">طلبات مكتملة</div>
                        <div className="text-2xl font-black text-blue-700 mt-1 tabular-nums">{completedCount}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-emerald-600">المبيعات المحققة</div>
                        <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">
                            {totalRevenue.toFixed(2)} <span className="text-xs font-bold">{currency}</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="البحث برقم الطلب (NOVA-XXXX)، اسم العميل، أو رقم الهاتف..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">جميع حالات الطلب</option>
                        <option value="pending">قيد الانتظار</option>
                        <option value="processing">قيد التجهيز</option>
                        <option value="completed">مكتمل</option>
                        <option value="cancelled">ملغي</option>
                    </select>

                    {/* Payment Status Filter */}
                    <select
                        value={paymentFilter}
                        onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">جميع حالات السداد</option>
                        <option value="paid">مدفوع</option>
                        <option value="pending">معلق</option>
                        <option value="refunded">مسترجع</option>
                        <option value="failed">فاشل</option>
                    </select>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchOrders}
                        disabled={loading}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition disabled:opacity-50"
                        title="تحديث القائمة"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="py-20 text-center space-y-3">
                        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <div className="text-xs font-bold text-slate-500">جاري تحميل طلبات المتجر...</div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="py-20 text-center space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800">لا توجد طلبات مطابقة</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            لم يتم العثور على أي طلبات في المتجر الحالي بناءً على معايير البحث والفلترة المحددة.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="py-3.5 px-4">رقم الطلب</th>
                                    <th className="py-3.5 px-4">العميل والمستلم</th>
                                    <th className="py-3.5 px-4">التاريخ</th>
                                    <th className="py-3.5 px-4">طريقة السداد</th>
                                    <th className="py-3.5 px-4">حالة الدفع</th>
                                    <th className="py-3.5 px-4">حالة الطلب</th>
                                    <th className="py-3.5 px-4">المجموع الكلي</th>
                                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {orders.map((ord) => (
                                    <tr 
                                        key={ord.id}
                                        className="hover:bg-slate-50/60 transition cursor-pointer"
                                        onClick={() => setSelectedOrder(ord)}
                                    >
                                        <td className="py-3.5 px-4">
                                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                                {ord.order_number}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-slate-900">{ord.customer?.name}</div>
                                            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                                                <span>{ord.customer?.phone}</span>
                                                <span>•</span>
                                                <span>{ord.shipping?.city}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                                            {ord.created_at ? new Date(ord.created_at).toLocaleDateString('ar-SA') : '—'}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-bold text-slate-700">
                                                {getPaymentMethodLabel(ord.payment?.method)}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {getPaymentBadge(ord.payment?.status)}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {getStatusBadge(ord.status)}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-black text-slate-900 tabular-nums text-sm">
                                                {(ord.financials?.total || 0).toFixed(2)} {ord.financials?.currency || currency}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => setSelectedOrder(ord)}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-xl font-bold transition flex items-center gap-1 mx-auto"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>التفاصيل</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Order Details Drawer / Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div 
                        className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-base text-slate-900">
                                            تفاصيل الطلب: {selectedOrder.order_number}
                                        </h3>
                                        {getStatusBadge(selectedOrder.status)}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        تاريخ الطلب: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('ar-SA') : '—'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                            
                            {/* Merchant Action Bar: Status Transitions */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-black text-slate-900">تحديث حالة الطلب:</span>
                                    {selectedOrder.status === 'cancelled' && (
                                        <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                                            تم استرجاع المخزون تلقائياً
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <button
                                        type="button"
                                        disabled={isUpdatingStatus || selectedOrder.status === 'pending'}
                                        onClick={() => handleUpdateStatus(selectedOrder.id, 'pending')}
                                        className={`py-2 px-3 rounded-xl font-bold transition text-center ${
                                            selectedOrder.status === 'pending'
                                                ? 'bg-amber-600 text-white shadow-xs'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-700'
                                        }`}
                                    >
                                        قيد الانتظار
                                    </button>

                                    <button
                                        type="button"
                                        disabled={isUpdatingStatus || selectedOrder.status === 'processing'}
                                        onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                                        className={`py-2 px-3 rounded-xl font-bold transition text-center ${
                                            selectedOrder.status === 'processing'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                                        }`}
                                    >
                                        قيد التجهيز
                                    </button>

                                    <button
                                        type="button"
                                        disabled={isUpdatingStatus || selectedOrder.status === 'completed'}
                                        onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                                        className={`py-2 px-3 rounded-xl font-bold transition text-center ${
                                            selectedOrder.status === 'completed'
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                                        }`}
                                    >
                                        مكتمل وتم الشحن
                                    </button>

                                    <button
                                        type="button"
                                        disabled={isUpdatingStatus || selectedOrder.status === 'cancelled'}
                                        onClick={() => {
                                            if (confirm('هل أنت متأكد من إلغاء هذا الطلب؟ سيتم استرجاع كميات المنتجات إلى المخزون تلقائياً.')) {
                                                handleUpdateStatus(selectedOrder.id, 'cancelled');
                                            }
                                        }}
                                        className={`py-2 px-3 rounded-xl font-bold transition text-center ${
                                            selectedOrder.status === 'cancelled'
                                                ? 'bg-rose-600 text-white shadow-xs'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                                        }`}
                                    >
                                        إلغاء الطلب واسترجاع المخزون
                                    </button>
                                </div>

                                {/* Payment Status Selector */}
                                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                                    <span className="font-bold text-slate-700">حالة سداد الفاتورة:</span>
                                    <select
                                        value={selectedOrder.payment?.status || 'pending'}
                                        disabled={isUpdatingStatus}
                                        onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="pending">معلق (Pending)</option>
                                        <option value="paid">مدفوع بالكامل (Paid)</option>
                                        <option value="refunded">مسترجع للعميل (Refunded)</option>
                                        <option value="failed">فشل السداد (Failed)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Customer and Shipping Information */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                                    <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                                        <User className="w-4 h-4 text-emerald-600" />
                                        <span>بيانات المشتري:</span>
                                    </h4>
                                    <div className="space-y-1 text-slate-600">
                                        <div><span className="font-bold text-slate-800">الاسم:</span> {selectedOrder.customer?.name}</div>
                                        <div><span className="font-bold text-slate-800">الجوال:</span> <span className="font-mono" dir="ltr">{selectedOrder.customer?.phone}</span></div>
                                        {selectedOrder.customer?.email && (
                                            <div><span className="font-bold text-slate-800">البريد:</span> <span className="font-mono">{selectedOrder.customer?.email}</span></div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                                    <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-emerald-600" />
                                        <span>عنوان الشحن والتوصيل:</span>
                                    </h4>
                                    <div className="space-y-1 text-slate-600">
                                        <div><span className="font-bold text-slate-800">المدينة:</span> {selectedOrder.shipping?.city}</div>
                                        <div><span className="font-bold text-slate-800">العنوان:</span> {selectedOrder.shipping?.address}</div>
                                        {selectedOrder.shipping?.notes && (
                                            <div><span className="font-bold text-slate-800">ملاحظات التوصيل:</span> {selectedOrder.shipping?.notes}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Line Items List */}
                            <div className="space-y-3">
                                <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                                    <span>المنتجات المطلوبة ({selectedOrder.items?.length || 0}):</span>
                                </h4>

                                <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                                    {selectedOrder.items?.map((item) => (
                                        <div key={item.id} className="p-3.5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                                    {item.product?.image_url ? (
                                                        <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ShoppingBag className="w-5 h-5 text-emerald-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-xs">{item.product_name}</div>
                                                    <div className="text-[11px] text-slate-500 font-mono">
                                                        رمز SKU: {item.product_sku || '—'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-600">
                                                        {item.quantity} × {parseFloat(item.unit_price).toFixed(2)} {selectedOrder.financials?.currency || currency}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="font-black text-slate-900 tabular-nums">
                                                {parseFloat(item.total_price).toFixed(2)} {selectedOrder.financials?.currency || currency}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                                <div className="flex justify-between text-slate-600">
                                    <span>المجموع الفرعي:</span>
                                    <span className="font-bold tabular-nums">
                                        {(selectedOrder.financials?.subtotal || 0).toFixed(2)} {selectedOrder.financials?.currency || currency}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>رسوم الشحن:</span>
                                    <span className="font-bold tabular-nums">
                                        {(selectedOrder.financials?.shipping_fee || 0).toFixed(2)} {selectedOrder.financials?.currency || currency}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>ضريبة القيمة المضافة (15%):</span>
                                    <span className="font-bold tabular-nums">
                                        {(selectedOrder.financials?.tax_amount || 0).toFixed(2)} {selectedOrder.financials?.currency || currency}
                                    </span>
                                </div>
                                <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-slate-900 text-sm">
                                    <span>الإجمالي الكلي للطلب:</span>
                                    <span className="text-emerald-700 tabular-nums">
                                        {(selectedOrder.financials?.total || 0).toFixed(2)} {selectedOrder.financials?.currency || currency}
                                    </span>
                                </div>
                            </div>

                        </div>

                        {/* Drawer Footer */}
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
                            <span className="text-[11px] text-slate-500 font-mono">
                                معرف الطلب في قاعدة البيانات: #{selectedOrder.id}
                            </span>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition"
                            >
                                إغلاق النافذة
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
