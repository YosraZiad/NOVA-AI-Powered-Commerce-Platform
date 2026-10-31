import React, { useState, useEffect, useRef } from 'react';
import { 
    Sparkles, X, Send, Bot, User, RefreshCw, ShoppingBag, 
    ArrowRight, Check, AlertCircle, ChevronDown, ExternalLink,
    Zap, Eye, MessageSquare, ShieldCheck
} from 'lucide-react';
import axios from 'axios';

export default function StorefrontAiAssistant({
    tenantSlug,
    currentTenant,
    cart = [],
    onAddToCart,
    onQuickView,
    activeProduct = null,
    currentUser = null
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationUuid, setConversationUuid] = useState(null);
    const [provider, setProvider] = useState(null);
    const [addedIds, setAddedIds] = useState([]);
    const [unreadBadge, setUnreadBadge] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const currency = currentTenant?.currency || 'SAR';
    const storeName = currentTenant?.name || 'المتجر';

    // Helper: Obtain or generate secure guest session ID
    const getGuestSessionId = () => {
        try {
            let sid = sessionStorage.getItem('nova_guest_session_id');
            if (!sid) {
                sid = 'guest_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
                sessionStorage.setItem('nova_guest_session_id', sid);
            }
            return sid;
        } catch {
            return 'guest_fallback_' + Date.now();
        }
    };

    // Default quick suggestion prompts
    const quickPrompts = [
        "ما هي المنتجات الأكثر طلباً في المتجر؟",
        "اقترح لي خيارات مميزة بأقل من 200 ريال",
        "هل يتوفر شحن مجاني وما هي شروطه؟",
        "ما هي سياسة الاسترجاع والضمان المتاحة؟"
    ];

    // Initialize conversation with welcome message
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: `مرحباً بك في **${storeName}**! 👋 أنا مساعدك الذكي للتسوق، كيف يمكنني مساعدتك اليوم في اختيار المنتج المناسب لاحتياجاتك وميزانيتك؟`,
                    recommended_products: [],
                    created_at: new Date().toISOString()
                }
            ]);
        }
    }, [storeName]);

    // Restore existing conversation if available in session
    useEffect(() => {
        try {
            const savedUuid = sessionStorage.getItem(`nova_ai_active_uuid_${tenantSlug}`);
            if (savedUuid && tenantSlug) {
                const guestSessionId = getGuestSessionId();
                axios.get(`/api/v1/storefront/${tenantSlug}/ai/conversations/${savedUuid}`, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Session-ID': guestSessionId
                    }
                }).then(res => {
                    if (res.data?.status === 'success' && res.data?.messages?.length > 0) {
                        setConversationUuid(savedUuid);
                        setMessages(res.data.messages);
                    }
                }).catch(() => {
                    sessionStorage.removeItem(`nova_ai_active_uuid_${tenantSlug}`);
                });
            }
        } catch {}
    }, [tenantSlug]);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, loading]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setUnreadBadge(false);
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    // Handle Quick Add to Cart with temporary badge
    const handleQuickAdd = (product) => {
        if (onAddToCart) {
            onAddToCart(product, 1);
            setAddedIds(prev => [...prev, product.id]);
            setTimeout(() => {
                setAddedIds(prev => prev.filter(id => id !== product.id));
            }, 2500);
        }
    };

    // Reset Conversation
    const handleResetChat = () => {
        setConversationUuid(null);
        setProvider(null);
        try {
            sessionStorage.removeItem(`nova_ai_active_uuid_${tenantSlug}`);
        } catch {}
        setMessages([
            {
                id: 'welcome-' + Date.now(),
                role: 'assistant',
                content: `تم بدء محادثة جديدة! يسعدني إجابتك عن أي استفسار حول مواصفات المنتجات، الأسعار، أو العروض المتوفرة في **${storeName}**.`,
                recommended_products: [],
                created_at: new Date().toISOString()
            }
        ]);
    };

    // Send Message to Storefront AI API
    const handleSendMessage = async (textToSend = null) => {
        const messageText = (textToSend || input).trim();
        if (!messageText || loading) return;

        // Add user message to UI immediately
        const userMsg = {
            id: 'user-' + Date.now(),
            role: 'user',
            content: messageText,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const guestSessionId = getGuestSessionId();
            // Build Context payload
            const payload = {
                message: messageText,
                conversation_uuid: conversationUuid,
                session_id: guestSessionId,
                context: {
                    current_product_id: activeProduct?.id || null,
                    cart_items: cart.map(item => ({ product_id: item.id, qty: item.qty }))
                }
            };

            const response = await axios.post(`/api/v1/storefront/${tenantSlug}/ai/chat`, payload, {
                headers: {
                    'Accept': 'application/json',
                    'X-Session-ID': guestSessionId
                }
            });

            const data = response.data;
            if (data.conversation_uuid) {
                setConversationUuid(data.conversation_uuid);
                try {
                    sessionStorage.setItem(`nova_ai_active_uuid_${tenantSlug}`, data.conversation_uuid);
                } catch {}
            }
            if (data.provider) {
                setProvider(data.provider);
            }

            const assistantMsg = {
                id: 'ai-' + Date.now(),
                role: 'assistant',
                content: data.reply || 'شكراً لسؤالك! تصفح المنتجات المقترحة أدناه لمزيد من التفاصيل.',
                recommended_products: data.recommended_products || [],
                created_at: new Date().toISOString()
            };

            setMessages(prev => [...prev, assistantMsg]);

            if (!isOpen) {
                setUnreadBadge(true);
            }
        } catch (error) {
            console.error('AI chat error:', error);
            const fallbackMsg = {
                id: 'err-' + Date.now(),
                role: 'assistant',
                content: 'عذراً، حدث خطأ مؤقت في الاتصال بالمساعد الذكي. يمكنك تصفح المنتجات في الكتالوج أو المحاولة بعد قليل.',
                recommended_products: [],
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setLoading(false);
        }
    };

    // Render formatted markdown-like text (bold, lists)
    const renderContent = (content) => {
        if (!content) return null;
        
        // Simple markdown parsing for **bold** and bullet points
        const lines = content.split('\n');
        return (
            <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
                {lines.map((line, idx) => {
                    if (!line.trim()) return <div key={idx} className="h-1" />;
                    
                    // Replace **text** with <strong>text</strong>
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    const formatted = parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    });

                    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                        return (
                            <div key={idx} className="flex items-start gap-1.5 pr-2">
                                <span className="text-emerald-600 font-bold">•</span>
                                <span>{formatted}</span>
                            </div>
                        );
                    }

                    return <p key={idx}>{formatted}</p>;
                })}
            </div>
        );
    };

    return (
        <>
            {/* FLOATING TRIGGER BUTTON */}
            <div className="fixed bottom-6 left-6 z-40" dir="rtl">
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 hover:from-emerald-700 hover:to-black text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
                        title="مساعد نوفا الذكي"
                    >
                        <div className="relative">
                            <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
                            {unreadBadge && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                            )}
                        </div>
                        <span className="font-bold text-xs sm:text-sm tracking-wide">
                            المساعد الذكي
                        </span>
                        <span className="hidden sm:inline-block bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-mono text-emerald-100">
                            AI
                        </span>
                    </button>
                )}
            </div>

            {/* SLIDE-OUT / POPUP CHAT WINDOW */}
            {isOpen && (
                <div 
                    className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 w-[92vw] sm:w-[420px] max-h-[85vh] h-[640px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300" 
                    dir="rtl"
                >
                    {/* 1. HEADER */}
                    <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 flex items-center justify-between border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-emerald-600/80 flex items-center justify-center text-amber-300 shadow-inner border border-emerald-400/30">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-black text-sm text-white">
                                        مساعد {storeName} الذكي
                                    </h3>
                                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-mono px-1.5 py-0.2 rounded-md">
                                        {provider === 'openai' ? 'OpenAI' : (provider === 'gemini' ? 'Gemini' : 'NOVA AI')}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-300 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    إجابات فورية استناداً لمنتجات المتجر الحقيقية
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleResetChat}
                                title="بدء محادثة جديدة"
                                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                title="إغلاق"
                                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* 2. CHAT MESSAGES BODY */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
                        {messages.map((msg) => (
                            <div 
                                key={msg.id}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div 
                                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs ${
                                        msg.role === 'user'
                                            ? 'bg-emerald-600 text-white rounded-br-none'
                                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                                    }`}
                                >
                                    {msg.role === 'user' ? (
                                        <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    ) : (
                                        renderContent(msg.content)
                                    )}
                                </div>

                                {/* Recommended Products Showcase Cards */}
                                {msg.role === 'assistant' && msg.recommended_products && msg.recommended_products.length > 0 && (
                                    <div className="mt-3 w-full space-y-2">
                                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
                                            <ShoppingBag className="w-3 h-3 text-emerald-600" />
                                            المنتجات المقترحة من المتجر ({msg.recommended_products.length}):
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {msg.recommended_products.map((prod) => {
                                                const isAdded = addedIds.includes(prod.id);
                                                const imageUrl = prod.image_url || prod.images?.[0]?.url || null;

                                                return (
                                                    <div 
                                                        key={prod.id}
                                                        className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between gap-2"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-12 h-12 rounded-lg bg-slate-100 shrink-0 overflow-hidden border border-slate-100 flex items-center justify-center">
                                                                {imageUrl ? (
                                                                    <img 
                                                                        src={imageUrl} 
                                                                        alt={prod.name} 
                                                                        className="w-full h-full object-cover" 
                                                                    />
                                                                ) : (
                                                                    <ShoppingBag className="w-5 h-5 text-slate-400" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="text-xs font-bold text-slate-900 truncate" title={prod.name}>
                                                                    {prod.name}
                                                                </h4>
                                                                <div className="text-emerald-700 font-extrabold text-xs mt-0.5">
                                                                    {parseFloat(prod.price).toFixed(2)} {currency}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                                                            {onQuickView && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onQuickView(prod)}
                                                                    className="flex-1 py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                    <span>معاينة</span>
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuickAdd(prod)}
                                                                disabled={prod.stock_quantity <= 0 || isAdded}
                                                                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                                                                    isAdded 
                                                                        ? 'bg-emerald-100 text-emerald-800'
                                                                        : (prod.stock_quantity <= 0 
                                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs')
                                                                }`}
                                                            >
                                                                {isAdded ? (
                                                                    <>
                                                                        <Check className="w-3 h-3 text-emerald-600" />
                                                                        <span>تمت الإضافة!</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ShoppingBag className="w-3 h-3" />
                                                                        <span>{prod.stock_quantity <= 0 ? 'نفد' : 'شراء'}</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing / Loading Indicator */}
                        {loading && (
                            <div className="flex items-start gap-2 animate-in fade-in duration-200">
                                <div className="bg-white border border-slate-200/90 rounded-2xl rounded-bl-none p-3 shadow-xs flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">جاري البحث في الكتالوج...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* 3. QUICK PROMPT CHIPS */}
                    <div className="p-2.5 bg-white border-t border-slate-100 overflow-x-auto whitespace-nowrap flex items-center gap-1.5 scrollbar-none">
                        {quickPrompts.map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSendMessage(prompt)}
                                disabled={loading}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 px-2.5 py-1 rounded-full transition shrink-0 border border-slate-200"
                            >
                                <Zap className="w-2.5 h-2.5 text-amber-500" />
                                <span>{prompt}</span>
                            </button>
                        ))}
                    </div>

                    {/* 4. INPUT FOOTER */}
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                        }}
                        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
                    >
                        <div className="relative flex-1">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="اسأل عن المنتجات، الأسعار، أو التوصيل..."
                                maxLength={1000}
                                disabled={loading}
                                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                            />
                            {input.length > 500 && (
                                <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-400 font-mono">
                                    {input.length}/1000
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-2xl shadow-xs transition shrink-0"
                            title="إرسال"
                        >
                            <Send className="w-4 h-4 rotate-180" />
                        </button>
                    </form>

                    {/* Security & Verification Disclaimer */}
                    <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            بيانات مؤكدة ومحدثة من المتجر
                        </span>
                        <span className="font-mono">NOVA AI v1.0</span>
                    </div>
                </div>
            )}
        </>
    );
}
