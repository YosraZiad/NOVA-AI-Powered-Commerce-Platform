import React, { useState, useEffect } from 'react';
import { 
    Sparkles, LayoutDashboard, MessageSquare, FileText, 
    Megaphone, Boxes, Users, RefreshCw, Send, 
    Check, Copy, AlertTriangle, AlertCircle, TrendingUp, 
    ArrowUpRight, ArrowDownRight, ShieldCheck, ChevronRight,
    Zap, Eye, Save, Search, Clock, Calendar, ChevronDown,
    Sliders, HelpCircle, Package, ExternalLink
} from 'lucide-react';
import axios from 'axios';

export default function MerchantAiStudio({
    currentTenant,
    currentUser,
    products = [],
    categories = [],
    apiCall,
    showToast
}) {
    // Active sub-tab in AI Studio
    // 'overview' | 'bi_chat' | 'product_content' | 'marketing' | 'inventory' | 'customers'
    const [subTab, setSubTab] = useState('overview');

    const currency = currentTenant?.currency || 'SAR';
    const storeName = currentTenant?.name || 'متجر نوفا';

    // ==========================================
    // 1. OVERVIEW & EXECUTIVE BRIEFING STATE
    // ==========================================
    const [overviewData, setOverviewData] = useState(null);
    const [overviewLoading, setOverviewLoading] = useState(false);

    const loadOverview = async () => {
        setOverviewLoading(true);
        try {
            const res = await apiCall('/merchant/ai/overview');
            if (res && res.status === 'success') {
                setOverviewData(res);
            }
        } catch (err) {
            console.error('Failed to load AI overview:', err);
        } finally {
            setOverviewLoading(false);
        }
    };

    useEffect(() => {
        loadOverview();
    }, [currentTenant?.id]);

    // ==========================================
    // 2. BI CHAT STATE
    // ==========================================
    const [chatPeriod, setChatPeriod] = useState('30d');
    const [chatMessages, setChatMessages] = useState([
        {
            id: 'welcome',
            role: 'assistant',
            content: `مرحباً بك يا ${currentUser?.name || 'شريك النجاح'}! 💼 أنا مستشارك الإداري والتحليلي الذكي لمتجر **${storeName}**. يمكنك سؤالي عن أداء المبيعات، ومقارنة الفترات، وأكثر المنتجات ربحية، أو استراتيجيات تحسين الإيرادات.`,
            verified_facts: null,
            created_at: new Date().toISOString()
        }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    const quickBiQuestions = [
        "كيف كان أداء المتجر خلال هذه الفترة؟",
        "ما هي أكثر المنتجات مبيعاً وتحقيقاً للإيراد؟",
        "قارن أداء المبيعات بالفترة السابقة",
        "ما هي أهم التوصيات العملية لرفع الإيرادات؟"
    ];

    const handleSendBiChat = async (questionText = null) => {
        const text = (questionText || chatInput).trim();
        if (!text || chatLoading) return;

        const userMsg = {
            id: 'user-' + Date.now(),
            role: 'user',
            content: text,
            created_at: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await apiCall('/merchant/ai/chat', 'POST', {
                message: text,
                period: chatPeriod
            });

            if (res && res.status === 'success') {
                const aiMsg = {
                    id: 'ai-' + Date.now(),
                    role: 'assistant',
                    content: res.ai_analysis,
                    verified_facts: res.verified_facts,
                    provider: res.provider,
                    created_at: new Date().toISOString()
                };
                setChatMessages(prev => [...prev, aiMsg]);
            }
        } catch (err) {
            console.error('BI chat error:', err);
            setChatMessages(prev => [...prev, {
                id: 'err-' + Date.now(),
                role: 'assistant',
                content: 'عذراً، حدث خطأ أثناء معالجة استفسارك. يرجى المحاولة مرة أخرى.',
                created_at: new Date().toISOString()
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    // ==========================================
    // 3. PRODUCT CONTENT STUDIO STATE
    // ==========================================
    const [selectedProductId, setSelectedProductId] = useState('');
    const [contentForm, setContentForm] = useState({
        name: '',
        category_name: '',
        price: '',
        current_description: '',
        key_features: '',
        tone: 'professional',
        target_audience: 'المتسوقون في المملكة العربية السعودية والخليج'
    });
    const [generatedContent, setGeneratedContent] = useState(null);
    const [contentLoading, setContentLoading] = useState(false);
    const [isSavingProduct, setIsSavingProduct] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);

    // Auto-fill when product selected from dropdown
    const handleSelectProduct = (e) => {
        const pId = e.target.value;
        setSelectedProductId(pId);
        if (!pId) return;

        const found = products.find(p => String(p.id) === String(pId));
        if (found) {
            setContentForm(prev => ({
                ...prev,
                name: found.name,
                category_name: found.category?.name || '',
                price: found.price || '',
                current_description: found.description || '',
            }));
            setGeneratedContent(null);
        }
    };

    const handleGenerateContent = async (e) => {
        e?.preventDefault();
        if (!contentForm.name.trim() || contentLoading) return;

        setContentLoading(true);
        try {
            const payload = {
                product_id: selectedProductId ? parseInt(selectedProductId) : null,
                name: contentForm.name,
                category_name: contentForm.category_name,
                price: contentForm.price ? parseFloat(contentForm.price) : null,
                current_description: contentForm.current_description,
                key_features: contentForm.key_features,
                tone: contentForm.tone,
                target_audience: contentForm.target_audience
            };

            const res = await apiCall('/merchant/ai/product-content', 'POST', payload);
            if (res && res.status === 'success') {
                setGeneratedContent(res.generated_content);
                if (showToast) showToast('تم توليد المحتوى التسويقي بنجاح!', 'success');
            }
        } catch (err) {
            console.error('Failed to generate product content:', err);
            if (showToast) showToast('فشل في توليد المحتوى، يرجى المحاولة لاحقاً', 'error');
        } finally {
            setContentLoading(false);
        }
    };

    const handleApplyContentToProduct = async () => {
        if (!selectedProductId || !generatedContent) return;
        setIsSavingProduct(true);
        try {
            // Update product description via PUT /api/v1/products/{id}
            await apiCall(`/products/${selectedProductId}`, 'PUT', {
                description: generatedContent.long_description || generatedContent.short_description
            });
            if (showToast) showToast('تم حفظ الوصف الجديد للمنتج بنجاح في الكتالوج!', 'success');
        } catch (err) {
            console.error('Failed to update product description:', err);
            if (showToast) showToast('حدث خطأ أثناء حفظ وصف المنتج', 'error');
        } finally {
            setIsSavingProduct(false);
        }
    };

    const copyToClipboard = (text, key) => {
        navigator.clipboard?.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // ==========================================
    // 4. MARKETING STUDIO STATE
    // ==========================================
    const [marketingTheme, setMarketingTheme] = useState('general');
    const [marketingGoal, setMarketingGoal] = useState('زيادة المبيعات والوعي بالعلامة التجارية');
    const [marketingSelectedProducts, setMarketingSelectedProducts] = useState([]);
    const [marketingData, setMarketingData] = useState(null);
    const [marketingLoading, setMarketingLoading] = useState(false);

    const handleGenerateMarketing = async () => {
        setMarketingLoading(true);
        try {
            const res = await apiCall('/merchant/ai/marketing', 'POST', {
                theme: marketingTheme,
                goal: marketingGoal,
                product_ids: marketingSelectedProducts
            });
            if (res && res.status === 'success') {
                setMarketingData(res);
                if (showToast) showToast('تم توليد مسودات الحملات التسويقية بنجاح!', 'success');
            }
        } catch (err) {
            console.error('Marketing generator error:', err);
            if (showToast) showToast('حدث خطأ أثناء توليد خطة التسويق', 'error');
        } finally {
            setMarketingLoading(false);
        }
    };

    // ==========================================
    // 5. INVENTORY INTELLIGENCE STATE
    // ==========================================
    const [inventoryInsights, setInventoryInsights] = useState(null);
    const [inventoryLoading, setInventoryLoading] = useState(false);

    const loadInventoryInsights = async () => {
        setInventoryLoading(true);
        try {
            const res = await apiCall('/merchant/ai/inventory-insights');
            if (res && res.status === 'success') {
                setInventoryInsights(res);
            }
        } catch (err) {
            console.error('Inventory insights error:', err);
        } finally {
            setInventoryLoading(false);
        }
    };

    // ==========================================
    // 6. CUSTOMER INSIGHTS STATE
    // ==========================================
    const [customerInsights, setCustomerInsights] = useState(null);
    const [customerLoading, setCustomerLoading] = useState(false);

    const loadCustomerInsights = async () => {
        setCustomerLoading(true);
        try {
            const res = await apiCall('/merchant/ai/customer-insights');
            if (res && res.status === 'success') {
                setCustomerInsights(res);
            }
        } catch (err) {
            console.error('Customer insights error:', err);
        } finally {
            setCustomerLoading(false);
        }
    };

    // Sub-tab switch triggers lazy loads
    useEffect(() => {
        if (subTab === 'inventory' && !inventoryInsights) {
            loadInventoryInsights();
        } else if (subTab === 'customers' && !customerInsights) {
            loadCustomerInsights();
        } else if (subTab === 'marketing' && !marketingData) {
            handleGenerateMarketing();
        }
    }, [subTab]);

    return (
        <div className="space-y-6 font-sans text-slate-900" dir="rtl">
            
            {/* 1. TOP HEADER & STUDIO NAVIGATION TABS */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-slate-900 text-white flex items-center justify-center shadow-md">
                            <Sparkles className="w-6 h-6 text-amber-300" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                    أستوديو ذكاء الأعمال والقرار (Merchant AI)
                                </h2>
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                    M6 AI Studio
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                مستشارك الذكي لتحليل الأداء، كتابة المحتوى التسويقي، حماية المخزون، وفهم العملاء
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 hidden sm:inline">نطاق المتجر:</span>
                        <span className="bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs px-3 py-1.5 rounded-xl">
                            {storeName} ({currency})
                        </span>
                    </div>
                </div>

                {/* Sub-Tabs Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
                    {[
                        { id: 'overview', label: 'الملخص التنفيذي', icon: LayoutDashboard },
                        { id: 'bi_chat', label: 'مستشار ذكاء الأعمال', icon: MessageSquare },
                        { id: 'product_content', label: 'صياغة وسيو المنتجات', icon: FileText },
                        { id: 'marketing', label: 'أستوديو التسويق والحملات', icon: Megaphone },
                        { id: 'inventory', label: 'ذكاء المخزون ومخاطر النفاد', icon: Boxes },
                        { id: 'customers', label: 'رؤى سلوك العملاء', icon: Users },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const active = subTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setSubTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                                    active 
                                        ? 'bg-slate-900 text-white shadow-xs' 
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${active ? 'text-amber-300' : 'text-slate-400'}`} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* SUB-TAB 1: EXECUTIVE OVERVIEW */}
            {/* ========================================================================= */}
            {subTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Executive Briefing Banner */}
                    <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
                        <div className="relative z-10 space-y-3 max-w-3xl">
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-3 py-1 rounded-full">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                التقرير التنفيذي لآخر 30 يوماً
                            </span>
                            <h3 className="text-lg sm:text-2xl font-black leading-relaxed">
                                {overviewData?.executive_briefing || 'جاري تلخيص أداء المتجر المالي والتشغيلي...'}
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                تستند جميع الأرقام الموضحة أدناه إلى العمليات المحاسبية المؤكدة والطلبات المكتملة في قاعدة البيانات.
                            </p>
                        </div>
                    </div>

                    {/* 4 Primary KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-2">
                            <span className="text-xs font-bold text-slate-500">الإيرادات المؤكدة (30 يوم)</span>
                            <div className="text-2xl font-black text-slate-900">
                                {overviewData?.kpis?.revenue_30d?.toLocaleString() || '0'} <span className="text-xs font-bold text-slate-500">{currency}</span>
                            </div>
                            {overviewData?.kpis?.growth !== null && (
                                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span>{overviewData?.kpis?.growth >= 0 ? '+' : ''}{overviewData?.kpis?.growth}% مقارنة بالفترة السابقة</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-2">
                            <span className="text-xs font-bold text-slate-500">عدد الطلبات (30 يوم)</span>
                            <div className="text-2xl font-black text-slate-900">
                                {overviewData?.kpis?.orders_30d || 0} <span className="text-xs font-bold text-slate-500">طلب</span>
                            </div>
                            <span className="text-[11px] text-slate-400 block">طلبات مؤكدة ومكتملة</span>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-2">
                            <span className="text-xs font-bold text-slate-500">متوسط قيمة الطلب (AOV)</span>
                            <div className="text-2xl font-black text-slate-900">
                                {overviewData?.kpis?.aov_30d?.toFixed(2) || '0.00'} <span className="text-xs font-bold text-slate-500">{currency}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 block">معدل إنفاق العميل للطلب</span>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-2">
                            <span className="text-xs font-bold text-slate-500">تنبيهات المخزون العاجلة</span>
                            <div className="text-2xl font-black text-rose-600">
                                {(overviewData?.inventory_summary?.out_of_stock_count || 0) + (overviewData?.inventory_summary?.critical_risk_count || 0)} <span className="text-xs font-bold text-slate-500">منتج</span>
                            </div>
                            <span className="text-[11px] text-rose-500 block">تتطلب تدخلاً فورياً لإعادة التوريد</span>
                        </div>
                    </div>

                    {/* Urgent Alerts Section */}
                    {overviewData?.urgent_alerts && overviewData.urgent_alerts.length > 0 && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <h4 className="font-black text-base text-slate-900">تنبيهات الأعمال الاستباقية</h4>
                            </div>
                            <div className="space-y-2.5">
                                {overviewData.urgent_alerts.map((alert, idx) => (
                                    <div key={idx} className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h5 className="font-bold text-xs sm:text-sm text-amber-950">{alert.title}</h5>
                                            <p className="text-xs text-amber-800/80 mt-0.5">{alert.description}</p>
                                        </div>
                                        <button 
                                            onClick={() => setSubTab('inventory')}
                                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shrink-0"
                                        >
                                            فحص المخزون
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Shortcuts to Tools */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div 
                            onClick={() => setSubTab('bi_chat')}
                            className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer space-y-2"
                        >
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <h4 className="font-bold text-sm text-slate-900">استشر مستشار ذكاء الأعمال</h4>
                            <p className="text-xs text-slate-500">اطرح أسئلة حول المبيعات والأداء واحصل على تحليلات دقيقة.</p>
                        </div>

                        <div 
                            onClick={() => setSubTab('product_content')}
                            className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer space-y-2"
                        >
                            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                                <FileText className="w-4 h-4" />
                            </div>
                            <h4 className="font-bold text-sm text-slate-900">أستوديو تحسين محتوى المنتجات</h4>
                            <p className="text-xs text-slate-500">توليد عناوين جذابة، أوصاف طويلة وموجزة، وبيانات سيو SEO متقدمة.</p>
                        </div>

                        <div 
                            onClick={() => setSubTab('marketing')}
                            className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer space-y-2"
                        >
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                                <Megaphone className="w-4 h-4" />
                            </div>
                            <h4 className="font-bold text-sm text-slate-900">أستوديو الأفكار التسويقية</h4>
                            <p className="text-xs text-slate-500">ابتكار أفكار حملات موسمية ومسودات احترافية لشبكات التواصل.</p>
                        </div>
                    </div>

                </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 2: BUSINESS INTELLIGENCE ASSISTANT */}
            {/* ========================================================================= */}
            {subTab === 'bi_chat' && (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-[700px] animate-in fade-in duration-200">
                    
                    {/* BI Assistant Header */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                                <MessageSquare className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">مستشار تحليل الأداء وذكاء الأعمال</h3>
                                <p className="text-[11px] text-slate-500">حسابات مالية دقيقة من قاعدة البيانات مع استشارات نمو مبنية على الحقائق</p>
                            </div>
                        </div>

                        {/* Period Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-bold">فترة التحليل:</span>
                            <select
                                value={chatPeriod}
                                onChange={(e) => setChatPeriod(e.target.value)}
                                className="bg-white border border-slate-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="today">اليوم (مقارنة بالأمس)</option>
                                <option value="7d">آخر 7 أيام (مقارنة بالسابقة)</option>
                                <option value="30d">آخر 30 يوماً</option>
                                <option value="month">الشهر الحالي حتى اللحظة</option>
                                <option value="all">كافة الفترات</option>
                            </select>
                        </div>
                    </div>

                    {/* Chat Messages Log */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
                        {chatMessages.map((msg) => (
                            <div 
                                key={msg.id}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div 
                                    className={`max-w-[85%] rounded-3xl p-4 shadow-xs ${
                                        msg.role === 'user'
                                            ? 'bg-emerald-700 text-white rounded-br-none'
                                            : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                                    }`}
                                >
                                    {/* Message Body */}
                                    <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </div>

                                    {/* Verified Facts Embedded Card */}
                                    {msg.verified_facts && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-2">
                                            <span className="font-bold text-slate-500 flex items-center gap-1">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                الحقائق المحسوبة والمؤكدة من قاعدة البيانات:
                                            </span>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                                                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                                                    <span className="text-slate-400 block text-[10px]">الإيرادات:</span>
                                                    <span className="font-bold text-slate-900">{msg.verified_facts.revenue?.toFixed(2)} {currency}</span>
                                                </div>
                                                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                                                    <span className="text-slate-400 block text-[10px]">الطلبات:</span>
                                                    <span className="font-bold text-slate-900">{msg.verified_facts.orders_count}</span>
                                                </div>
                                                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                                                    <span className="text-slate-400 block text-[10px]">متوسط الطلب:</span>
                                                    <span className="font-bold text-slate-900">{msg.verified_facts.average_order_value?.toFixed(2)} {currency}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {chatLoading && (
                            <div className="flex items-start gap-2">
                                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
                                    <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    <span className="text-xs text-slate-500 font-medium">جاري احتساب البيانات وإعداد التحليل...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Question Chips */}
                    <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
                        {quickBiQuestions.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSendBiChat(q)}
                                disabled={chatLoading}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 px-3 py-1.5 rounded-full transition shrink-0 border border-slate-200"
                            >
                                <Zap className="w-3 h-3 text-amber-500" />
                                <span>{q}</span>
                            </button>
                        ))}
                    </div>

                    {/* Input Area */}
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendBiChat();
                        }}
                        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
                    >
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="اكتب استفسارك هنا حول الأداء والمبيعات..."
                            disabled={chatLoading}
                            className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                            type="submit"
                            disabled={!chatInput.trim() || chatLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition flex items-center gap-1.5"
                        >
                            <span>إرسال</span>
                            <Send className="w-4 h-4 rotate-180" />
                        </button>
                    </form>
                </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 3: PRODUCT CONTENT STUDIO */}
            {/* ========================================================================= */}
            {subTab === 'product_content' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
                    
                    {/* Controls & Inputs Panel (Left/Right) */}
                    <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-black text-base text-slate-900">بيانات ومواصفات المنتج</h3>
                            <span className="text-[11px] text-slate-400">اختر منتجاً أو اكتب يدوياً</span>
                        </div>

                        {/* Product Picker Dropdown */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">اختيار منتج موجود في المتجر (اختياري):</label>
                            <select
                                value={selectedProductId}
                                onChange={handleSelectProduct}
                                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">-- إدخال منتج جديد يدوياً --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.sku}) - {p.price} {currency}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Product Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">اسم المنتج <span className="text-rose-500">*</span>:</label>
                            <input
                                type="text"
                                value={contentForm.name}
                                onChange={(e) => setContentForm({ ...contentForm, name: e.target.value })}
                                placeholder="مثال: سماعة رأس لاسلكية عازلة للضوضاء"
                                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Category & Price */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">التصنيف:</label>
                                <input
                                    type="text"
                                    value={contentForm.category_name}
                                    onChange={(e) => setContentForm({ ...contentForm, category_name: e.target.value })}
                                    placeholder="إلكترونيات"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">السعر ({currency}):</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={contentForm.price}
                                    onChange={(e) => setContentForm({ ...contentForm, price: e.target.value })}
                                    placeholder="250.00"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Tone of Voice */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">نبرة المحتوى التسويقي:</label>
                            <select
                                value={contentForm.tone}
                                onChange={(e) => setContentForm({ ...contentForm, tone: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="professional">احترافي وموثوق (Professional)</option>
                                <option value="luxury">فاخر وراقٍ (Luxury / Premium)</option>
                                <option value="marketing">تسويقي وجذاب (Persuasive)</option>
                                <option value="concise">موجز وعملي (Concise)</option>
                                <option value="youthful">عصري وشبابي (Youthful)</option>
                            </select>
                        </div>

                        {/* Key Features */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">أهم الميزات والمواصفات الحقيقية للمنتج:</label>
                            <textarea
                                rows={3}
                                value={contentForm.key_features}
                                onChange={(e) => setContentForm({ ...contentForm, key_features: e.target.value })}
                                placeholder="بطارية تدوم 40 ساعة، تقنية شحن سريع، وزن خفيف..."
                                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleGenerateContent}
                            disabled={!contentForm.name.trim() || contentLoading}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>{contentLoading ? 'جاري الصياغة والتحسين...' : 'توليد المحتوى التسويقي والسيو'}</span>
                        </button>
                    </div>

                    {/* Output & Editing Studio (Right/Left) */}
                    <div className="lg:col-span-7 space-y-4">
                        {generatedContent ? (
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-5 h-5 text-emerald-600" />
                                        <h3 className="font-black text-base text-slate-900">المحتوى المقترح للتحسين</h3>
                                    </div>
                                    {selectedProductId && (
                                        <button
                                            type="button"
                                            onClick={handleApplyContentToProduct}
                                            disabled={isSavingProduct}
                                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            <span>{isSavingProduct ? 'جاري الحفظ...' : 'حفظ بالكتالوج'}</span>
                                        </button>
                                    )}
                                </div>

                                {/* Suggested Titles */}
                                {generatedContent.suggested_titles && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">عناوين مقترحة للمنتج:</label>
                                        <div className="space-y-1">
                                            {generatedContent.suggested_titles.map((title, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                                                    <span className="font-bold text-slate-900">{title}</span>
                                                    <button 
                                                        onClick={() => copyToClipboard(title, 'title-' + idx)}
                                                        className="text-slate-400 hover:text-emerald-700 transition"
                                                        title="نسخ"
                                                    >
                                                        {copiedKey === 'title-' + idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Short Description */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700">الوصف التسويقي الموجز:</label>
                                        <button 
                                            onClick={() => copyToClipboard(generatedContent.short_description, 'short_desc')}
                                            className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                                        >
                                            {copiedKey === 'short_desc' ? 'تم النسخ!' : 'نسخ'}
                                        </button>
                                    </div>
                                    <textarea
                                        rows={2}
                                        value={generatedContent.short_description || ''}
                                        onChange={(e) => setGeneratedContent({ ...generatedContent, short_description: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs leading-relaxed"
                                    />
                                </div>

                                {/* Long Description */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700">الوصف التفصيلي الكامل:</label>
                                        <button 
                                            onClick={() => copyToClipboard(generatedContent.long_description, 'long_desc')}
                                            className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                                        >
                                            {copiedKey === 'long_desc' ? 'تم النسخ!' : 'نسخ'}
                                        </button>
                                    </div>
                                    <textarea
                                        rows={5}
                                        value={generatedContent.long_description || ''}
                                        onChange={(e) => setGeneratedContent({ ...generatedContent, long_description: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs leading-relaxed"
                                    />
                                </div>

                                {/* SEO Meta Suite */}
                                <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl space-y-3">
                                    <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                                        بيانات محركات البحث (SEO Meta):
                                    </span>
                                    
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold text-slate-600 block">عنوان السيو (Meta Title):</span>
                                        <input
                                            type="text"
                                            value={generatedContent.seo_title || ''}
                                            onChange={(e) => setGeneratedContent({ ...generatedContent, seo_title: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold text-slate-600 block">وصف السيو (Meta Description):</span>
                                        <textarea
                                            rows={2}
                                            value={generatedContent.seo_description || ''}
                                            onChange={(e) => setGeneratedContent({ ...generatedContent, seo_description: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold text-slate-600 block">الكلمات المفتاحية:</span>
                                        <input
                                            type="text"
                                            value={generatedContent.keywords || ''}
                                            onChange={(e) => setGeneratedContent({ ...generatedContent, keywords: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                                        />
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-12 border border-slate-200/90 shadow-xs text-center space-y-3 flex flex-col items-center justify-center min-h-[400px]">
                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <h4 className="font-bold text-base text-slate-800">مساحة المحتوى والسيو جاهزة</h4>
                                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                                    اختر منتجاً من القائمة الجانبية أو أدخل مواصفاته واضغط "توليد المحتوى" لتظهر هنا مسودة العناوين والأوصاف والسيو المجهزة للنشر.
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 4: MARKETING STUDIO */}
            {/* ========================================================================= */}
            {subTab === 'marketing' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Marketing Controls */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="font-black text-base text-slate-900">تخطيط الحملات الترويجية والمنشورات</h3>
                                <p className="text-xs text-slate-500 mt-0.5">مسودات تسويقية معدة للنشر على شبكات التواصل دون أي نشر تلقائي</p>
                            </div>

                            <button
                                onClick={handleGenerateMarketing}
                                disabled={marketingLoading}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-xs transition flex items-center gap-2 self-start"
                            >
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                <span>{marketingLoading ? 'جاري ابتكار الأفكار...' : 'توليد أفكار ومسودات جديدة'}</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">موسم / طابع الحملة:</label>
                                <select
                                    value={marketingTheme}
                                    onChange={(e) => setMarketingTheme(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="general">حملة دورية عامة</option>
                                    <option value="ramadan">عروض شهر رمضان المبارك</option>
                                    <option value="eid">تجهيزات واستعدادات العيد</option>
                                    <option value="national_day">اليوم الوطني السعودي / يوم التأسيس</option>
                                    <option value="weekend">عروض نهاية الأسبوع السريعة (Weekend Flash)</option>
                                    <option value="white_friday">تخفيضات الجمعة البيضاء</option>
                                    <option value="back_to_school">موسم العودة للمدارس / العمل</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">هدف الحملة:</label>
                                <input
                                    type="text"
                                    value={marketingGoal}
                                    onChange={(e) => setMarketingGoal(e.target.value)}
                                    placeholder="مثال: زيادة مبيعات المنتجات الأكثر طلباً"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Generated Campaigns Display */}
                    {marketingData?.drafts?.campaign_ideas && (
                        <div className="space-y-4">
                            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                                <Megaphone className="w-4 h-4 text-emerald-600" />
                                أفكار الحملات الترويجية المقترحة:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {marketingData.drafts.campaign_ideas.map((camp, idx) => (
                                    <div key={idx} className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                                حملة مقترحة #{idx + 1}
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-bold">{camp.target_audience}</span>
                                        </div>
                                        <h5 className="font-black text-base text-slate-900">{camp.name}</h5>
                                        <p className="text-xs font-bold text-emerald-700 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                                            "{camp.headline}"
                                        </p>
                                        <p className="text-xs text-slate-600 leading-relaxed">{camp.angle}</p>
                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-500">دعوة العمل (CTA):</span>
                                            <span className="font-bold text-slate-900">{camp.call_to_action}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Social Media Drafts */}
                    {marketingData?.drafts?.social_media_posts && (
                        <div className="space-y-4">
                            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-600" />
                                مسودات النشر لشبكات التواصل الاجتماعي:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {marketingData.drafts.social_media_posts.map((post, idx) => (
                                    <div key={idx} className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-black text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl">
                                                    {post.platform}
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard(post.copy, 'post-' + idx)}
                                                    className="text-xs text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                                                >
                                                    {copiedKey === 'post-' + idx ? 'تم النسخ!' : 'نسخ النص'}
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                {post.copy}
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-slate-400 text-center block pt-1 border-t border-slate-100">
                                            مسودة للاستخدام الداخلي
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 5: INVENTORY INTELLIGENCE */}
            {/* ========================================================================= */}
            {subTab === 'inventory' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Visual Breakdown Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-1.5">
                            <span className="text-xs font-bold text-slate-500">منتجات نفدت بالكامل</span>
                            <div className="text-2xl font-black text-rose-600">
                                {inventoryInsights?.summary?.out_of_stock_count || 0}
                            </div>
                            <span className="text-[10px] text-slate-400">توقف مبيعاتها بالكامل</span>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-1.5">
                            <span className="text-xs font-bold text-slate-500">خطر نفاد وشيك (&le; 7 أيام)</span>
                            <div className="text-2xl font-black text-amber-600">
                                {inventoryInsights?.summary?.critical_risk_count || 0}
                            </div>
                            <span className="text-[10px] text-slate-400">سرعة بيع عالية ورصيد حرج</span>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-1.5">
                            <span className="text-xs font-bold text-slate-500">مخزون منخفض تحت الحد</span>
                            <div className="text-2xl font-black text-amber-500">
                                {inventoryInsights?.summary?.warning_count || 0}
                            </div>
                            <span className="text-[10px] text-slate-400">تحت حد المخزون الأدنى</span>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-1.5">
                            <span className="text-xs font-bold text-slate-500">منتجات بطيئة الحركة</span>
                            <div className="text-2xl font-black text-indigo-600">
                                {inventoryInsights?.summary?.slow_moving_count || 0}
                            </div>
                            <span className="text-[10px] text-slate-400">بلا مبيعات في آخر 30 يوماً</span>
                        </div>
                    </div>

                    {/* AI Executive Inventory Analysis */}
                    {inventoryInsights?.ai_insights && (
                        <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-2.5 shadow-md">
                            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                التقييم والتحليل الاستراتيجي للمخزون
                            </span>
                            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                                {inventoryInsights.ai_insights}
                            </div>
                        </div>
                    )}

                    {/* Stock Risk Table */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h4 className="font-black text-sm text-slate-900">حالة المنتجات وسرعة الدوران وتوقعات النفاد</h4>
                            <span className="text-[11px] text-slate-400 font-mono">حسابات دقيقة من واقع الطلبات الفعلية</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                                    <tr>
                                        <th className="p-3.5 font-bold">المنتج والرمز</th>
                                        <th className="p-3.5 font-bold">الرصيد المتاح</th>
                                        <th className="p-3.5 font-bold">مبيعات (30 يوم)</th>
                                        <th className="p-3.5 font-bold">معدل البيع اليومي</th>
                                        <th className="p-3.5 font-bold">النفاد التقديري</th>
                                        <th className="p-3.5 font-bold">مستوى الخطورة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {inventoryInsights?.items?.map((item, idx) => {
                                        let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                                        let badgeText = 'متوازن';

                                        if (item.risk_level === 'out_of_stock') {
                                            badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
                                            badgeText = 'نافد تماماً';
                                        } else if (item.risk_level === 'critical') {
                                            badgeColor = 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse';
                                            badgeText = 'حرج (وشيك)';
                                        } else if (item.risk_level === 'warning') {
                                            badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                                            badgeText = 'منخفض';
                                        } else if (item.risk_level === 'slow_moving') {
                                            badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                                            badgeText = 'بطيء الحركة';
                                        }

                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/60 transition">
                                                <td className="p-3.5 font-bold text-slate-900">
                                                    <div>{item.name}</div>
                                                    <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                                                </td>
                                                <td className="p-3.5 font-bold text-slate-800">{item.stock_quantity} وحدة</td>
                                                <td className="p-3.5 font-bold text-slate-700">{item.units_sold_30d} وحدة</td>
                                                <td className="p-3.5 font-mono text-slate-600">{item.daily_velocity} / يوم</td>
                                                <td className="p-3.5 font-bold">
                                                    {item.days_until_stockout !== null 
                                                        ? `${item.days_until_stockout} يوم` 
                                                        : 'غير مهدد'}
                                                </td>
                                                <td className="p-3.5">
                                                    <span className={`inline-block border px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                                                        {badgeText}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-TAB 6: CUSTOMER INSIGHTS */}
            {/* ========================================================================= */}
            {subTab === 'customers' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Privacy & Methodology Notice */}
                    <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-3xl flex items-center justify-between text-xs text-emerald-950">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            <span><strong>معايير الخصوصية:</strong> هذه التحليلات تعتمد حصرياً على بيانات مجمعة دون معالجة أسماء أو أرقام هواتف أو وسائل دفع.</span>
                        </div>
                        <span className="font-mono text-[11px] bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                            حجم العينة: {customerInsights?.overview?.total_unique_customers || 0} عميل
                        </span>
                    </div>

                    {/* Customer Overview Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-1.5">
                            <span className="text-xs font-bold text-slate-500">إجمالي قاعدة العملاء المتسوقين</span>
                            <div className="text-2xl font-black text-slate-900">
                                {customerInsights?.overview?.total_unique_customers || 0} <span className="text-xs text-slate-400 font-bold">عميل</span>
                            </div>
                            <span className="text-[10px] text-slate-400">سجلوا طلبات مؤكدة في المتجر</span>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-1.5">
                            <span className="text-xs font-bold text-slate-500">معدل تكرار الشراء (Repeat Rate)</span>
                            <div className="text-2xl font-black text-emerald-600">
                                {customerInsights?.overview?.repeat_purchase_rate || 0}%
                            </div>
                            <span className="text-[10px] text-slate-400">نسبة العملاء الذين طلبوا أكثر من مرة</span>
                        </div>

                        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-1.5">
                            <span className="text-xs font-bold text-slate-500">عملاء القيمة العالية (1000+ ريال)</span>
                            <div className="text-2xl font-black text-slate-900">
                                {customerInsights?.customer_segments?.high_value || 0} <span className="text-xs text-slate-400 font-bold">عميل</span>
                            </div>
                            <span className="text-[10px] text-slate-400">الفئة الأكثر إنفاقاً في المتجر</span>
                        </div>
                    </div>

                    {/* AI Executive Customer Strategic Analysis */}
                    {customerInsights?.ai_insights && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
                            <span className="text-emerald-800 font-black text-xs flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                التحليل الاستراتيجي لسلوك المتسوقين
                            </span>
                            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {customerInsights.ai_insights}
                            </div>
                        </div>
                    )}

                    {/* Top Cities and Categories Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Geographic distribution */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900">أعلى المدن طلباً (التوزيع الجغرافي):</h4>
                            <div className="space-y-2">
                                {customerInsights?.geographic_distribution?.map((c, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                                        <span className="font-bold text-slate-800">{c.city}</span>
                                        <span className="text-slate-500 font-mono">{c.orders_count} طلب ({c.revenue} {currency})</span>
                                    </div>
                                ))}
                                {(!customerInsights?.geographic_distribution || customerInsights.geographic_distribution.length === 0) && (
                                    <p className="text-xs text-slate-400 py-4 text-center">لا توجد بيانات كافية عن المدن حالياً.</p>
                                )}
                            </div>
                        </div>

                        {/* Category preferences */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900">أكثر الأقسام تفضيلاً وإقبالاً:</h4>
                            <div className="space-y-2">
                                {customerInsights?.category_preferences?.map((cat, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                                        <span className="font-bold text-slate-800">{cat.category}</span>
                                        <span className="text-slate-500 font-mono">{cat.units} وحدة مباعة ({cat.revenue} {currency})</span>
                                    </div>
                                ))}
                                {(!customerInsights?.category_preferences || customerInsights.category_preferences.length === 0) && (
                                    <p className="text-xs text-slate-400 py-4 text-center">لا توجد بيانات مبيعات فئات مسجلة حالياً.</p>
                                )}
                            </div>
                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}
