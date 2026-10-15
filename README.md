# NOVA — AI-Powered Multi-Tenant Commerce Platform

<p align="center">
  <strong>منصة تجارة إلكترونية سحابية متعددة المتاجر (Multi-Tenant) مصممة لتجارة التجزئة العصرية في السوق السعودي والخليجي.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel" alt="Laravel 12" />
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/PHPUnit-93%20Passed-brightgreen?style=for-the-badge" alt="Tests 93 Passed" />
</p>

---

## 🌟 نظرة عامة (Overview)

**NOVA** هي منصة تجارة إلكترونية سحابية متطورة تتيح تشغيل نموذج العمل التجاري للبرمجيات كخدمة (SaaS):
1. **الترخيص المستقل (Standalone License):** إمكانية نشر نسخة مستقلة تماماً ومخصصة لعميل على بنيته التحتية الخاصة.
2. **المتاجر المستضافة (Hosted Store Rental):** تشغيل وإدارة متاجر مستقلة متعددة المستأجرين (Multi-Tenant) مع عزل أمني وصارم لقواعد البيانات والكتالوج والطلبات والمستخدمين.

---

## 🛡️ التجارب الأربع المستقلة (Four Discrete Experiences)

تمت هيكلة النظام ليوفر 4 تجارب مستقلة تماماً ومفصولة أمنياً وصلاحياتياً:

1. **بوابة إدارة المنصة (Platform Admin Portal - `/platform`):**
   - إدارة المستأجرين والمتاجر، تدقيق التراخيص، إحصائيات المنصة، وإعدادات النظام العامة.
2. **لوحة تحكم التاجر (Merchant Dashboard - `/merchant`):**
   - إدارة الكتالوج والمنتجات والفئات، المخزون، وسجل النشاط ضمن نطاق المتجر المعتمد فقط.
3. **متجر العملاء الفاخر (Customer Storefront - `/store/{slug}`):**
   - تجربة تسوق حقيقية راقية مصممة خصيصاً للمستهلك السعودي والخليجي.
   - شريط إعلانات علوي، ركائز الثقة الأربع، عروض حصرية، وأقسام تفاعلية.
   - فلترة وبحث متقدم، معاينة سريعة، وشراء فوري مع دعم الريال السعودي (SAR) واللغة العربية بالكامل (RTL).
4. **حساب العميل وإتمام الطلب (Customer Account & Checkout):**
   - تدفق دفع سلس من 3 خطوات يشمل مدن المملكة ووسائل الدفع (مدى، Apple Pay، الدفع عند الاستلام).
   - سجل طلبات موثق بأرقام مرجعية وفواتير فورية.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

### Backend
- **Framework:** Laravel 12
- **Database:** MySQL
- **Authentication & Security:** Laravel Sanctum
- **Authorization & Roles:** Spatie Laravel Permission
- **Multi-Tenancy:** Custom Scoped Isolation Middleware & Global Tenant Context
- **Testing:** PHPUnit / Pest Feature & Security Isolation Tests

### Frontend
- **Library:** React 19 (SPA Architecture)
- **Bundler:** Vite 7
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Language:** JavaScript / JSX

---

## 🚀 التثبيت والتشغيل المحلي (Getting Started)

### المتطلبات المسبقة:
- PHP >= 8.2
- Composer
- Node.js >= 18.x & npm
- MySQL

### خطوات الإعداد:

```bash
# 1. استنساخ المستودع
git clone https://github.com/YosraZiad/NOVA-AI-Powered-Commerce-Platform.git
cd NOVA-AI-Powered-Commerce-Platform

# 2. تثبيت حزم الـ Backend
composer install

# 3. إعداد ملف البيئة
cp .env.example .env
php artisan key:generate

# 4. إعداد قاعدة البيانات والبيانات الأولية
php artisan migrate --seed

# 5. تثبيت وبناء واجهات الـ Frontend
npm install
npm run build # أو npm run dev للتطوير الحي

# 6. تشغيل الخادم المحلي
php artisan serve
```

---

## 🧪 حزمة الاختبارات والأمان (Automated Test Suite)

المشروع مغطى بحزمة اختبارات تكاملية وأمنية تضمن عزل المتاجر (Tenant Isolation) وسلامة الصلاحيات:

```bash
php artisan test
```

**النتيجة:**
```text
Tests:    93 passed (426 assertions)
Duration: 100% Green
```

---

## 📄 الترخيص (License)

هذا المشروع ملكية خاصة — **All Rights Reserved © 2026 NOVA Commerce Platform**.
