import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MerchantDashboard from './components/MerchantDashboard';
import ProductCatalog from './components/ProductCatalog';
import ProductFormModal from './components/ProductFormModal';
import CategoriesManager from './components/CategoriesManager';
import SecurityLab from './components/SecurityLab';
import PlatformAdminPortal from './components/PlatformAdminPortal';
import StorefrontLayout from './components/StorefrontLayout';
import CustomerAccount from './components/CustomerAccount';
import OrdersManager from './components/OrdersManager';
import DevToolsDrawer from './components/DevToolsDrawer';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import { ShieldAlert, Store, User, LogIn, ArrowRight, Lock } from 'lucide-react';

export default function App() {
    // URL Routing State
    const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
    
    // Merchant active tab
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'products' | 'categories' | 'security_lab'
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Auth & Tenant state
    const [token, setToken] = useState(localStorage.getItem('nova_token') || null);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentTenant, setCurrentTenant] = useState(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Catalog data state
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters for catalog and storefront
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');

    // Modals
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Toast notifications
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success', title = null) => {
        setToast({ message, type, title });
        setTimeout(() => setToast(null), 3500);
    };

    // Cart state
    const [cart, setCart] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('nova_cart')) || [];
        } catch {
            return [];
        }
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // Real-time API logs for security audit
    const [consoleLogs, setConsoleLogs] = useState([]);

    // Save cart
    useEffect(() => {
        localStorage.setItem('nova_cart', JSON.stringify(cart));
    }, [cart]);

    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = () => {
            setCurrentPath(window.location.pathname);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Navigate helper
    const navigateTo = (path) => {
        if (window.location.pathname !== path) {
            window.history.pushState({}, '', path);
        }
        setCurrentPath(path);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Unified API caller
    const apiCall = async (endpoint, options = {}) => {
        const startTime = performance.now();
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const activeAuthToken = options.overrideToken !== undefined ? options.overrideToken : token;
        if (activeAuthToken && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${activeAuthToken}`;
        }

        const method = options.method || 'GET';
        let responseStatus = 0;
        let responseData = null;

        try {
            const res = await fetch(endpoint, {
                method,
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            responseStatus = res.status;
            responseData = await res.json().catch(() => null);
        } catch (err) {
            responseStatus = 0;
            responseData = { error: err.message };
        }

        const duration = Math.round(performance.now() - startTime);

        // Record log for security lab inspector
        setConsoleLogs(prev => [{
            id: Date.now() + Math.random(),
            method,
            url: endpoint,
            status: responseStatus,
            duration,
            data: responseData,
            time: new Date().toLocaleTimeString('ar-SA')
        }, ...prev.slice(0, 40)]);

        return { status: responseStatus, data: responseData };
    };

    // Fetch session and initial data
    const fetchSessionAndData = async (activeAuthToken = token) => {
        if (!activeAuthToken) return;

        // 1. Authenticated User Profile
        const meRes = await apiCall('/api/v1/auth/me', { overrideToken: activeAuthToken });
        if (meRes.status === 200 && meRes.data?.user) {
            setCurrentUser(meRes.data.user);

            // 2. Current Tenant Context
            const tenantRes = await apiCall('/api/v1/tenant/current', { overrideToken: activeAuthToken });
            if (tenantRes.status === 200 && tenantRes.data?.tenant) {
                setCurrentTenant(tenantRes.data.tenant);
            } else {
                setCurrentTenant(null);
            }

            // 3. Categories & Products
            await loadCategories(activeAuthToken);
            await loadProducts(activeAuthToken);
        } else {
            handleLogout();
        }
    };

    const loadCategories = async (activeAuthToken = token) => {
        const res = await apiCall('/api/v1/categories', { overrideToken: activeAuthToken });
        if (res.status === 200) {
            setCategories(res.data?.data || []);
        }
    };

    const loadProducts = async (activeAuthToken = token) => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedCategory) params.append('category_id', selectedCategory);
        if (sortBy) params.append('sort_by', sortBy);
        if (sortDir) params.append('sort_direction', sortDir);

        const url = `/api/v1/products?${params.toString()}`;
        const res = await apiCall(url, { overrideToken: activeAuthToken });

        if (res.status === 200) {
            setProducts(res.data?.data || []);
        }
        setLoading(false);
    };

    // Storefront Catalog Loader by Slug
    const loadStorefrontCatalog = async (slug) => {
        setLoading(true);
        const [infoRes, pRes, cRes] = await Promise.all([
            apiCall(`/api/v1/storefront/${slug}`),
            apiCall(`/api/v1/storefront/${slug}/products`),
            apiCall(`/api/v1/storefront/${slug}/categories`)
        ]);

        if (infoRes.status === 200 && infoRes.data?.tenant) {
            setCurrentTenant(infoRes.data.tenant);
        }
        if (pRes.status === 200 && pRes.data?.data) {
            setProducts(pRes.data.data);
        }
        if (cRes.status === 200 && cRes.data?.data) {
            setCategories(cRes.data.data);
        }
        setLoading(false);
    };

    // Refetch products when filters change on merchant view
    useEffect(() => {
        if (token && (currentPath.startsWith('/merchant') || currentPath.startsWith('/admin'))) {
            loadProducts(token);
        }
    }, [search, selectedCategory, sortBy, sortDir, currentPath]);

    // Handle Quick Login (Demo switcher)
    const handleQuickLogin = async (email, password) => {
        setLoading(true);
        const res = await apiCall('/api/v1/auth/login', {
            method: 'POST',
            body: { email, password },
            overrideToken: null
        });

        if (res.status === 200 && res.data?.token) {
            const newToken = res.data.token;
            setToken(newToken);
            localStorage.setItem('nova_token', newToken);
            setCurrentUser(res.data.user);
            await fetchSessionAndData(newToken);
            showToast(`تم تسجيل الدخول بنجاح كـ ${res.data.user.name}`, 'success', 'جلسة نشطة');
        } else {
            showToast(res.data?.message || 'فشل تسجيل الدخول', 'error', 'خطأ في المصادقة');
        }
        setLoading(false);
    };

    // Handle Switch Store in Storefront
    const handleSwitchStore = async (email, slug) => {
        await handleQuickLogin(email, 'password');
        navigateTo(`/store/${slug}`);
    };

    // Handle Logout
    const handleLogout = async () => {
        if (token) {
            await apiCall('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
        }
        setToken(null);
        setCurrentUser(null);
        setCurrentTenant(null);
        setProducts([]);
        setCategories([]);
        localStorage.removeItem('nova_token');
        showToast('تم تسجيل الخروج بنجاح', 'info');
    };

    // Auth modal success
    const handleAuthSuccess = async (newToken, user) => {
        setToken(newToken);
        localStorage.setItem('nova_token', newToken);
        setCurrentUser(user);
        await fetchSessionAndData(newToken);
        showToast(`مرحباً بك، ${user.name}`, 'success', 'تم الدخول');
    };

    // Create or Update Product
    const handleSaveProduct = async (payload, id = null) => {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/v1/products/${id}` : '/api/v1/products';

        const res = await apiCall(url, { method, body: payload });

        if (res.status === 201 || res.status === 200) {
            setIsProductModalOpen(false);
            setEditingProduct(null);
            showToast(id ? 'تم تحديث بيانات المنتج بنجاح' : 'تمت إضافة المنتج ونشره في الكتالوج', 'success');
            await loadProducts();
            return true;
        } else {
            const errMsg = res.data?.errors ? Object.values(res.data.errors).flat().join(' | ') : res.data?.message;
            showToast(errMsg || 'فشل حفظ المنتج، تأكد من صحة المدخلات', 'error', 'خطأ في التحقق');
            return false;
        }
    };

    // Delete Product
    const handleDeleteProduct = async (product) => {
        const res = await apiCall(`/api/v1/products/${product.id}`, { method: 'DELETE' });

        if (res.status === 200) {
            showToast(`تم حذف المنتج "${product.name}" بنجاح`, 'success');
            await loadProducts();
        } else {
            showToast(`رفض الحذف: ${res.data?.message || 'غير مصرح'} (كود ${res.status})`, 'error', 'عملية مرفوضة');
        }
    };

    // Add Category
    const handleAddCategory = async (payload) => {
        const res = await apiCall('/api/v1/categories', { method: 'POST', body: payload });

        if (res.status === 201) {
            showToast('تمت إضافة التصنيف بنجاح', 'success');
            await loadCategories();
            return true;
        } else {
            const err = res.data?.errors ? Object.values(res.data.errors).flat().join(' | ') : res.data?.message;
            showToast(err || 'فشل إضافة التصنيف', 'error', 'خطأ');
            return false;
        }
    };

    // Delete Category (Safe delete check)
    const handleDeleteCategory = async (id) => {
        const res = await apiCall(`/api/v1/categories/${id}`, { method: 'DELETE' });

        if (res.status === 200) {
            showToast('تم حذف التصنيف بنجاح', 'success');
            await loadCategories();
            return { success: true };
        } else {
            return { 
                success: false, 
                message: res.data?.message || 'تم رفض الحذف: هذا التصنيف يحتوي على منتجات مرتبطة لحماية تكامل البيانات.' 
            };
        }
    };

    // Cart actions
    const addToCart = (product, qty = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + qty } : item);
            }
            return [...prev, { ...product, qty }];
        });
        showToast(`تمت إضافة "${product.name}" إلى السلة`, 'success');
    };

    const updateCartQty = (id, qty) => {
        setCart(prev => prev.map(item => item.id === id ? { ...item, qty } : item));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const clearCart = () => {
        setCart([]);
    };

    const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);

    // Initial session load: fetch user & tenant context if token is present
    useEffect(() => {
        if (token) {
            fetchSessionAndData(token);
        }
    }, []);

    // Determine current route experience
    const isPlatformRoute = currentPath.startsWith('/platform');
    const isAccountRoute = currentPath === '/account';
    const isSecurityLabRoute = currentPath === '/security-lab';
    const isMerchantRoute = currentPath.startsWith('/merchant') || currentPath.startsWith('/admin');
    const isStorefrontRoute = !isPlatformRoute && !isMerchantRoute && !isAccountRoute && !isSecurityLabRoute;

    // Extract store slug for storefront
    const getStoreSlug = () => {
        if (currentPath.startsWith('/store/')) {
            const rawSlug = currentPath.replace('/store/', '').split('/')[0];
            if (rawSlug) return rawSlug;
        }
        return currentTenant?.slug || 'demo-store';
    };
    const extractedSlug = isStorefrontRoute ? getStoreSlug() : (currentTenant?.slug || 'demo-store');

    // Load storefront catalog if on storefront view
    useEffect(() => {
        if (isStorefrontRoute && extractedSlug) {
            loadStorefrontCatalog(extractedSlug);
        }
    }, [extractedSlug, isStorefrontRoute]);

    // Check merchant permissions
    const isMerchantOrStaff = currentUser?.roles?.some(r => ['Merchant', 'Staff', 'Platform Admin'].includes(r));

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
            
            {/* ========================================================================= */}
            {/* EXPERIENCE 1: PLATFORM ADMIN PORTAL (/platform) */}
            {/* ========================================================================= */}
            {isPlatformRoute && (
                <div className="flex-1 flex flex-col">
                    <PlatformAdminPortal
                        currentUser={currentUser}
                        apiCall={apiCall}
                        onNavigate={navigateTo}
                        showToast={showToast}
                    />
                </div>
            )}

            {/* ========================================================================= */}
            {/* EXPERIENCE 2: CUSTOMER STOREFRONT (/store or /store/:slug) */}
            {/* ========================================================================= */}
            {isStorefrontRoute && (
                <div className="flex-1 flex flex-col">
                    <StorefrontLayout
                        storeSlug={extractedSlug}
                        currentTenant={currentTenant}
                        products={products}
                        categories={categories}
                        loading={loading}
                        cart={cart}
                        addToCart={addToCart}
                        search={search}
                        setSearch={setSearch}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        sortDir={sortDir}
                        setSortDir={setSortDir}
                        currentUser={currentUser}
                        onNavigate={navigateTo}
                        setIsCartOpen={setIsCartOpen}
                        setIsAuthModalOpen={setIsAuthModalOpen}
                        onSwitchStore={handleSwitchStore}
                        onOpenCheckout={() => setIsCheckoutOpen(true)}
                    />
                </div>
            )}

            {/* ========================================================================= */}
            {/* EXPERIENCE 3: CUSTOMER ACCOUNT (/account) */}
            {/* ========================================================================= */}
            {isAccountRoute && (
                <div className="flex-1 flex flex-col">
                    <CustomerAccount
                        currentUser={currentUser}
                        currentTenant={currentTenant}
                        cart={cart}
                        onLogout={handleLogout}
                        onNavigate={navigateTo}
                        setIsCartOpen={setIsCartOpen}
                        setIsAuthModalOpen={setIsAuthModalOpen}
                        apiCall={apiCall}
                    />
                </div>
            )}

            {/* ========================================================================= */}
            {/* EXPERIENCE 4: MERCHANT DASHBOARD (/merchant or /admin) */}
            {/* ========================================================================= */}
            {isMerchantRoute && (
                <div className="flex-1 flex min-h-screen">
                    {/* Check if user is not logged in */}
                    {!currentUser ? (
                        <div className="flex-1 flex items-center justify-center p-6 bg-slate-100">
                            <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-5 shadow-xs">
                                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white mx-auto flex items-center justify-center font-bold">
                                    <Lock className="w-8 h-8 text-emerald-400" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black text-slate-900">لوحة تحكم المتجر (Store Admin)</h2>
                                    <p className="text-xs text-slate-500">
                                        يرجى تسجيل الدخول بحساب تاجر مصرح للوصول إلى إدارة المنتجات والطلبات وإعدادات المتجر.
                                    </p>
                                </div>
                                <div className="pt-2 flex flex-col gap-2.5">
                                    <button
                                        onClick={() => setIsAuthModalOpen(true)}
                                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                                    >
                                        <LogIn className="w-4 h-4 text-emerald-400" />
                                        <span>تسجيل الدخول كتاجر</span>
                                    </button>
                                    <button
                                        onClick={() => navigateTo('/')}
                                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                                    >
                                        <Store className="w-4 h-4" />
                                        <span>العودة لواجهة المتجر للعملاء</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : !isMerchantOrStaff ? (
                        <div className="flex-1 flex items-center justify-center p-6 bg-slate-100">
                            <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-5 shadow-xs">
                                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 mx-auto flex items-center justify-center font-bold">
                                    <ShieldAlert className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black text-slate-900">منطقة إدارة التجار</h2>
                                    <p className="text-xs text-slate-500">
                                        أنت مسجل حالياً كـ <span className="font-bold text-slate-800">{currentUser.name} (عميل متسوق)</span>. لوحة التحكم هذه مخصصة للتاجر وموظفي المتجر فقط.
                                    </p>
                                </div>
                                <div className="pt-2 flex flex-col gap-2.5">
                                    <button
                                        onClick={() => navigateTo(`/store/${currentTenant?.slug || 'demo-store'}`)}
                                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                                    >
                                        <Store className="w-4 h-4" />
                                        <span>الانتقال إلى متجر العملاء للتسوق</span>
                                    </button>
                                    <button
                                        onClick={() => navigateTo('/account')}
                                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                                    >
                                        <User className="w-4 h-4" />
                                        <span>حسابي الشخصي وسجل الطلبات</span>
                                    </button>
                                    <button
                                        onClick={() => setIsAuthModalOpen(true)}
                                        className="w-full py-2 bg-transparent hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-medium transition"
                                    >
                                        تسجيل الدخول بحساب تاجر آخر
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Merchant Sidebar */}
                            <Sidebar
                                activeView={isSecurityLabRoute ? 'security_lab' : activeView}
                                setActiveView={(view) => {
                                    if (view === 'security_lab') {
                                        navigateTo('/security-lab');
                                    } else {
                                        if (currentPath !== '/merchant' && currentPath !== '/admin') {
                                            navigateTo('/merchant');
                                        }
                                        setActiveView(view);
                                    }
                                }}
                                currentUser={currentUser}
                                currentTenant={currentTenant}
                                onLogout={handleLogout}
                                onOpenAuth={() => setIsAuthModalOpen(true)}
                                onNavigate={navigateTo}
                                isMobileOpen={isMobileOpen}
                                setIsMobileOpen={setIsMobileOpen}
                            />

                            {/* Main Merchant Content Area */}
                            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                                <Header
                                    activeView={isSecurityLabRoute ? 'security_lab' : activeView}
                                    setActiveView={setActiveView}
                                    currentTenant={currentTenant}
                                    cartCount={totalCartCount}
                                    setIsCartOpen={setIsCartOpen}
                                    onOpenAddProduct={['dashboard', 'products'].includes(activeView) && !isSecurityLabRoute ? () => { setEditingProduct(null); setIsProductModalOpen(true); } : null}
                                    setIsMobileOpen={setIsMobileOpen}
                                    onNavigate={navigateTo}
                                />

                                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                    {isSecurityLabRoute ? (
                                        <SecurityLab
                                            apiCall={apiCall}
                                            products={products}
                                            consoleLogs={consoleLogs}
                                        />
                                    ) : (
                                        <>
                                            {activeView === 'dashboard' && (
                                                <MerchantDashboard
                                                    currentUser={currentUser}
                                                    currentTenant={currentTenant}
                                                    products={products}
                                                    categories={categories}
                                                    loading={loading}
                                                    setActiveView={setActiveView}
                                                    onOpenAddProduct={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                                                />
                                            )}

                                            {activeView === 'orders' && (
                                                <OrdersManager
                                                    currentTenant={currentTenant}
                                                    currentUser={currentUser}
                                                    apiCall={apiCall}
                                                    showToast={showToast}
                                                />
                                            )}

                                            {activeView === 'products' && (
                                                <ProductCatalog
                                                    products={products}
                                                    categories={categories}
                                                    currentTenant={currentTenant}
                                                    loading={loading}
                                                    search={search}
                                                    setSearch={setSearch}
                                                    selectedCategory={selectedCategory}
                                                    setSelectedCategory={setSelectedCategory}
                                                    sortBy={sortBy}
                                                    setSortBy={setSortBy}
                                                    sortDir={sortDir}
                                                    setSortDir={setSortDir}
                                                    onOpenAddProduct={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                                                    onEditProduct={(p) => { setEditingProduct(p); setIsProductModalOpen(true); }}
                                                    onDeleteProduct={handleDeleteProduct}
                                                    currentUser={currentUser}
                                                />
                                            )}

                                            {activeView === 'categories' && (
                                                <CategoriesManager
                                                    categories={categories}
                                                    products={products}
                                                    currentTenant={currentTenant}
                                                    onAddCategory={handleAddCategory}
                                                    onDeleteCategory={handleDeleteCategory}
                                                    loading={loading}
                                                />
                                            )}
                                        </>
                                    )}
                                </main>

                                <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500 mt-auto">
                                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div className="font-medium">
                                            منصة <span className="font-bold text-slate-800">نوفا للتجارة السحابية الذكية</span> — متوافقة مع معايير التجارة والتطبيقات السحابية السعودية والخليجية.
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                                            <span>M1: Security Isolation</span>
                                            <span>•</span>
                                            <span>M2: Product Catalog</span>
                                            <span>•</span>
                                            <span>M3: Cart & Orders</span>
                                        </div>
                                    </div>
                                </footer>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* FLOATING DEV-ONLY TOOLS DRAWER (Decoupled from User Interfaces) */}
            {/* ========================================================================= */}
            {(import.meta.env.DEV || ['localhost', '127.0.0.1'].includes(window.location.hostname)) && (
                <DevToolsDrawer
                    currentUser={currentUser}
                    currentTenant={currentTenant}
                    onQuickLogin={handleQuickLogin}
                    onNavigate={navigateTo}
                    activeRoute={currentPath}
                />
            )}

            {/* Product Create & Edit Modal */}
            <ProductFormModal
                isOpen={isProductModalOpen}
                onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
                onSave={handleSaveProduct}
                editingProduct={editingProduct}
                categories={categories}
                currentTenant={currentTenant}
            />

            {/* Slide-over Cart Drawer */}
            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                updateCartQty={updateCartQty}
                removeFromCart={removeFromCart}
                clearCart={clearCart}
                currentTenant={currentTenant}
                onOpenCheckout={() => setIsCheckoutOpen(true)}
            />

            {/* Seamless 3-Step Saudi Checkout Modal */}
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                cart={cart}
                clearCart={clearCart}
                currentTenant={currentTenant}
                currentUser={currentUser}
                showToast={showToast}
                apiCall={apiCall}
            />

            {/* Auth Modal (Login / Register) */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLoginSuccess={handleAuthSuccess}
            />

            {/* Global Toast */}
            <Toast toast={toast} onClose={() => setToast(null)} />

        </div>
    );
}

// Mount React Root
const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
