import React, { useState } from 'react';
import { 
    Layers, Plus, Search, Trash2, Edit, 
    AlertCircle, CheckCircle2, ShieldAlert, X, 
    Package, Info, AlertTriangle, ArrowRight 
} from 'lucide-react';

export default function CategoriesManager({
    categories,
    products,
    currentTenant,
    onAddCategory,
    onDeleteCategory,
    loading
}) {
    const [search, setSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatSlug, setNewCatSlug] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Safe deletion test state
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [deleteWarning, setDeleteWarning] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Auto generate slug from name
    const handleNameChange = (val) => {
        setNewCatName(val);
        const generatedSlug = val.trim().toLowerCase().replace(/[\s\W-]+/g, '-');
        setNewCatSlug(generatedSlug);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;

        setSubmitting(true);
        const payload = {
            name: newCatName.trim(),
            slug: newCatSlug.trim() || undefined,
            description: newCatDesc.trim() || null
        };

        const success = await onAddCategory(payload);
        if (success) {
            setIsAddModalOpen(false);
            setNewCatName('');
            setNewCatSlug('');
            setNewCatDesc('');
        }
        setSubmitting(false);
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;

        setIsDeleting(true);
        const result = await onDeleteCategory(categoryToDelete.id);
        setIsDeleting(false);

        if (!result.success) {
            setDeleteWarning(result.message || 'تم رفض الحذف: هذا التصنيف يحتوي على منتجات مرتبطة لحماية تكامل البيانات.');
        } else {
            setCategoryToDelete(null);
            setDeleteWarning(null);
        }
    };

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.slug.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-12">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        إدارة وتصنيف الكتالوج
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        تنظيم الأقسام والتصنيفات لمتجر <span className="font-semibold text-slate-800">{currentTenant?.name || 'نوفا'}</span> مع عزل تام لكل مستأجر.
                    </p>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-700/20 active:scale-98"
                >
                    <Plus className="w-4 h-4" />
                    <span>إضافة تصنيف جديد</span>
                </button>
            </div>

            {/* Quick Stats & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-bold text-slate-500">إجمالي التصنيفات</div>
                        <div className="text-xl font-black text-slate-900 mt-0.5">{categories.length}</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                        <Layers className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-bold text-slate-500">التصنيفات النشطة</div>
                        <div className="text-xl font-black text-slate-900 mt-0.5">{categories.length}</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-bold text-slate-500">حماية الحذف الآمن (M2)</div>
                        <div className="text-xs font-bold text-emerald-700 mt-0.5">مفعلة وتمنع كسر الروابط</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <ShieldAlert className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Categories Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5">
                
                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="بحث في التصنيفات بالاسم أو الـ Slug..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                    />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200/80">
                            <tr>
                                <th className="py-3 px-4">اسم التصنيف</th>
                                <th className="py-3 px-4">معرّف الرابط (Slug)</th>
                                <th className="py-3 px-4">الوصف</th>
                                <th className="py-3 px-4">المنتجات المرتبطة</th>
                                <th className="py-3 px-4 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {filteredCategories.map((c) => {
                                const linkedProducts = products.filter(p => p.category_id === c.id || p.category?.id === c.id);

                                return (
                                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                                                <Layers className="w-3.5 h-3.5" />
                                            </div>
                                            <span>{c.name}</span>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-slate-500">{c.slug}</td>
                                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{c.description || '—'}</td>
                                        <td className="py-3.5 px-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                                                linkedProducts.length > 0
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                                {linkedProducts.length} منتجات
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <button
                                                onClick={() => {
                                                    setCategoryToDelete(c);
                                                    setDeleteWarning(null);
                                                }}
                                                className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                                                title="اختبار الحذف الآمن للتصنيف"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                <span>فحص الحذف</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Add Category Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div 
                        className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-black text-base text-slate-900">إضافة تصنيف جديد</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-700 font-bold mb-1.5">اسم التصنيف <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={newCatName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="مثال: أجهزة منزلية ذكية"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-1.5">الـ Slug (معرّف الرابط اللاتيني)</label>
                                <input
                                    type="text"
                                    value={newCatSlug}
                                    onChange={(e) => setNewCatSlug(e.target.value.toLowerCase())}
                                    placeholder="smart-home"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-1.5">الوصف (اختياري)</label>
                                <textarea
                                    rows="2"
                                    value={newCatDesc}
                                    onChange={(e) => setNewCatDesc(e.target.value)}
                                    placeholder="نبذة عن المنتجات التي تندرج تحت هذا التصنيف..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                                ></textarea>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-sm disabled:opacity-50"
                                >
                                    {submitting ? 'جاري الحفظ...' : 'حفظ التصنيف'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Safe Delete Check Modal */}
            {categoryToDelete && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div 
                        className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6" />
                        </div>

                        <div>
                            <h3 className="font-extrabold text-base text-slate-900">
                                اختبار الحذف الآمن للتصنيف
                            </h3>
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                محاولة حذف التصنيف <span className="font-bold text-slate-800">"{categoryToDelete.name}"</span>. 
                                وفقاً لقواعد M2، إذا كان التصنيف يحتوي على منتجات مرتبطة فسيتم رفض الحذف لحماية اتساق البيانات.
                            </p>

                            {deleteWarning && (
                                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold leading-relaxed flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                    <span>{deleteWarning}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    setCategoryToDelete(null);
                                    setDeleteWarning(null);
                                }}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                            >
                                إغلاق
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>جاري فحص الحذف...</span>
                                    </>
                                ) : (
                                    <span>تنفيذ محاولة الحذف</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
