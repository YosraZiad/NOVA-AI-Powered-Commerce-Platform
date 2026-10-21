import React, { useState, useEffect } from 'react';
import { 
    Settings, Store, Mail, Phone, MapPin, 
    AlertTriangle, ShieldCheck, RefreshCw, Save, 
    FileText, DollarSign, Building2, ExternalLink 
} from 'lucide-react';

export default function StoreSettings({
    currentTenant,
    currentUser,
    apiCall,
    showToast,
    onTenantUpdated
}) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // Form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [currency, setCurrency] = useState('SAR');
    const [logoUrl, setLogoUrl] = useState('');

    // Settings nested fields
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactAddress, setContactAddress] = useState('');
    const [lowStockThreshold, setLowStockThreshold] = useState(5);
    const [shippingPolicy, setShippingPolicy] = useState('');
    const [returnPolicy, setReturnPolicy] = useState('');

    const loadSettings = async () => {
        setLoading(true);
        setErrors({});
        try {
            const res = await apiCall('/api/v1/merchant/settings');
            if (res.status === 200 && res.data) {
                const tenant = res.data.tenant || {};
                const s = res.data.settings || {};

                setName(tenant.name || '');
                setDescription(tenant.description || '');
                setCurrency(tenant.currency || 'SAR');
                setLogoUrl(tenant.logo || tenant.logo_url || '');

                setContactEmail(s.contact_email || '');
                setContactPhone(s.contact_phone || '');
                setContactAddress(s.contact_address || '');
                setLowStockThreshold(s.low_stock_threshold !== undefined ? s.low_stock_threshold : 5);
                setShippingPolicy(s.shipping_policy || '');
                setReturnPolicy(s.return_policy || '');
            } else {
                showToast(res.data?.message || 'تعذر تحميل إعدادات المتجر', 'error');
            }
        } catch (err) {
            showToast('حدث خطأ أثناء الاتصال بالخادم', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, [currentTenant?.id]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            const payload = {
                name: name.trim(),
                description: description.trim() || null,
                currency,
                logo_url: logoUrl.trim() || null,
                settings: {
                    contact_email: contactEmail.trim() || null,
                    contact_phone: contactPhone.trim() || null,
                    contact_address: contactAddress.trim() || null,
                    low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
                    shipping_policy: shippingPolicy.trim() || null,
                    return_policy: returnPolicy.trim() || null,
                }
            };

            const res = await apiCall('/api/v1/merchant/settings', {
                method: 'PATCH',
                body: payload
            });

            if (res.status === 200 && res.data) {
                showToast('تم حفظ وتحديث إعدادات المتجر بنجاح', 'success');
                if (onTenantUpdated && res.data.tenant) {
                    onTenantUpdated(res.data.tenant);
                }
            } else if (res.status === 422 && res.data?.errors) {
                setErrors(res.data.errors);
                showToast('يرجى التحقق من الأخطاء في المدخلات', 'error');
            } else {
                showToast(res.data?.message || 'فشل حفظ الإعدادات', 'error');
            }
        } catch (err) {
            showToast('حدث خطأ غير متوقع أثناء الحفظ', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <span>جاري تحميل إعدادات المتجر وسجل السياسات...</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="space-y-6 pb-12">
            
            {/* Header Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                            تكوين متجر التاجر الحصري (M4)
                        </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">إعدادات وهوية المتجر</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        تخصيص اسم المتجر، العملة، قنوات التواصل، عتبة تنبيه المخزون، وسياسات الشحن والاسترجاع.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-700/20 active:scale-95"
                    >
                        {saving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>حفظ التعديلات</span>
                    </button>
                </div>
            </div>

            {/* Section 1: Store Branding & Identity */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Store className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm text-slate-900">الهوية الأساسية للمتجر</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Store Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            اسم المتجر <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-slate-900 font-bold"
                        />
                        {errors.name && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.name[0]}</p>}
                    </div>

                    {/* Currency */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            عملة المتجر الأساسية <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-slate-900 font-bold font-mono"
                        >
                            <option value="SAR">SAR - ريال سعودي</option>
                            <option value="AED">AED - درهم إماراتي</option>
                            <option value="KWD">KWD - دينار كويتي</option>
                            <option value="BHD">BHD - دينار بحريني</option>
                            <option value="OMR">OMR - ريال عماني</option>
                            <option value="QAR">QAR - ريال قطري</option>
                            <option value="USD">USD - دولار أمريكي</option>
                        </select>
                        {errors.currency && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.currency[0]}</p>}
                    </div>

                    {/* Logo URL */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            رابط الشعار أو الصورة التعريفية (URL)
                        </label>
                        <input
                            type="url"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            placeholder="https://example.com/logo.png"
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-slate-800 font-mono"
                        />
                        {errors.logo_url && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.logo_url[0]}</p>}
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            نبذة تعريفية عن المتجر
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="اكتب نبذة مختصرة تصف نشاط متجرك ومنتجاتك..."
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-slate-800"
                        />
                        {errors.description && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.description[0]}</p>}
                    </div>
                </div>
            </div>

            {/* Section 2: Contact Information */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Phone className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-sm text-slate-900">بيانات الاتصال وخدمة العملاء</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Contact Email */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني للدعم</label>
                        <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="support@store.sa"
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-slate-800 font-mono"
                        />
                        {errors['settings.contact_email'] && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors['settings.contact_email'][0]}</p>}
                    </div>

                    {/* Contact Phone */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم هاتف / واتساب المتجر</label>
                        <input
                            type="text"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="0500000000 أو 920000000"
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-slate-800 font-mono"
                        />
                        {errors['settings.contact_phone'] && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors['settings.contact_phone'][0]}</p>}
                    </div>

                    {/* Low Stock Threshold */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">حد التنبيه لانخفاض المخزون</label>
                        <input
                            type="number"
                            min="1"
                            max="500"
                            value={lowStockThreshold}
                            onChange={(e) => setLowStockThreshold(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-slate-900 font-mono font-bold"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">يتم التنبيه عند وصول مخزون أي منتج لهذا العدد أو أقل</p>
                    </div>

                    {/* Contact Address */}
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">العنوان أو المقر الجغرافي</label>
                        <input
                            type="text"
                            value={contactAddress}
                            onChange={(e) => setContactAddress(e.target.value)}
                            placeholder="مثال: الرياض - طريق الملك فهد - مجمع الأعمال"
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-slate-800"
                        />
                    </div>
                </div>
            </div>

            {/* Section 3: Store Policies */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-sm text-slate-900">سياسات المتجر (الشحن والاسترجاع)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Shipping Policy */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">سياسة الشحن والتسليم</label>
                        <textarea
                            rows={4}
                            value={shippingPolicy}
                            onChange={(e) => setShippingPolicy(e.target.value)}
                            placeholder="وضح تفاصيل شركات الشحن المعتمدة ومدة التوصيل لعملائك..."
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-amber-500 text-slate-800"
                        />
                    </div>

                    {/* Return Policy */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">سياسة الاستبدال والاسترجاع</label>
                        <textarea
                            rows={4}
                            value={returnPolicy}
                            onChange={(e) => setReturnPolicy(e.target.value)}
                            placeholder="وضح شروط وإجراءات الاسترجاع خلال المهلة المحددة..."
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-amber-500 text-slate-800"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Save Action */}
            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/20 active:scale-95"
                >
                    {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    <span>حفظ جميع إعدادات المتجر</span>
                </button>
            </div>

        </form>
    );
}
