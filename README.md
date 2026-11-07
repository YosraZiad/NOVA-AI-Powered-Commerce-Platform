# NOVA — AI-Powered Multi-Tenant Commerce Platform

<p align="center">
  <strong>منصة تجارة إلكترونية ذكية متكاملة ومتعددة المتاجر (Multi-Tenant) مصممة لتجارة التجزئة العصرية في السوق السعودي والخليجي مع دعم الذكاء الاصطناعي للمتسوقين والتجار.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel" alt="Laravel 12" />
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tests-155%20Passed-brightgreen?style=for-the-badge" alt="Tests 155 Passed" />
  <img src="https://img.shields.io/badge/Production-Ready-emerald?style=for-the-badge" alt="Production Ready" />
</p>

---

## 🌟 نظرة عامة (Overview)

**NOVA** هي منصة تجارة إلكترونية سحابية ذكية تدعم نموذجي نشر معتمدين دون الحاجة لتغيير الشيفرة البرمجية:
1. **الترخيص المستقل (Standalone License):** نشر نسخة مستقلة تماماً ومخصصة لعميل على بنيته التحتية وسيرفراته الخاصة (`NOVA_DEPLOYMENT_MODE=standalone`).
2. **المتاجر المستضافة مركزياً (Centrally Hosted Multi-Tenant):** تشغيل وإدارة متاجر مستقلة متعددة المستأجرين مع عزل أمني وصارم لقواعد البيانات والكتالوج والطلبات والمستخدمين (`NOVA_DEPLOYMENT_MODE=hosted`).

---

## 🛡️ التجارب المستقلة في النظام (System Experiences)

1. **متجر العملاء الفاخر (Customer Storefront - `/store/{slug}`):**
   - واجهة مستخدم عربية راقية (RTL) مع دعم كامل للريال السعودي (SAR).
   - تصفح الكتالوج، فلترة متقدمة، سلة مشتريات فورية، وإتمام طلب سلس من 3 خطوات (مدى، Apple Pay، الدفع عند الاستلام).
   - **مساعد التسوق الذكي (Customer AI Assistant):** محادثة تفاعلية تجيب عن استفسارات المنتجات وتقترح بدائل تناسب الميزانية مع محرك حتمي محلي في حال غياب مفاتيح API.
2. **لوحة تحكم التاجر (Merchant Dashboard - `/merchant`):**
   - إدارة الكتالوج، الفئات، المنتجات، الصور، والخيارات (Variants).
   - إدارة الطلبات، دورة حياة الدفع، وتعديل المخزون مع حماية من تضارب العمليات المتزامنة (Race Conditions).
   - **استوديو ذكاء التاجر (Merchant AI Studio):** ذكاء الأعمال (BI)، صياغة أوصاف المنتجات وتحسين محركات البحث (SEO)، أفكار الحملات التسويقية، استخبارات سرعة نفاد المخزون، وتحليلات سلوك العملاء المجمعة دون تسريب أي بيانات شخصية (Zero PII).
3. **بوابة إدارة المنصة (Platform Admin Portal - `/platform`):**
   - إدارة المستأجرين، تفعيل وتعليق المتاجر، مراقبة مؤشرات المنصة الشاملة، وعزل كامل عن المتاجر الفردية.
4. **حساب العميل (Customer Account - `/account`):**
   - تتبع الطلبات، فواتير الشراء، وسجل العناوين في نطاق حساب العميل فقط.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

### Backend
- **Framework:** Laravel 12 (PHP 8.2+)
- **Database:** MySQL 8.0+ / SQLite (Testing)
- **Authentication:** Laravel Sanctum (Token-based)
- **Authorization & RBAC:** Spatie Laravel Permission
- **Multi-Tenancy:** Custom Scoped Isolation Middleware & Global Tenant Context
- **AI Engine:** Provider Abstraction (OpenAI GPT-4o-mini, Google Gemini 1.5 Flash, and Offline Deterministic Fallback Engine)
- **Security:** SecurityHeaders Middleware, Rate Limiting, Input Sanitization, Terminal Order Locking

### Frontend
- **Framework:** React 19 (SPA Architecture)
- **Bundler:** Vite 7 with Optimized Vendor Chunking (`vendor-react`, `vendor-axios`, `vendor-icons`)
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Language:** JavaScript / JSX

---

## 🚀 التثبيت والتشغيل المحلي (Getting Started)

### المتطلبات المسبقة:
- PHP >= 8.2
- Composer
- Node.js >= 20.x & npm
- MySQL أو SQLite

### خطوات الإعداد السريع:

```bash
# 1. استنساخ المستودع
git clone https://github.com/YosraZiad/NOVA-AI-Powered-Commerce-Platform.git
cd NOVA-AI-Powered-Commerce-Platform

# 2. تثبيت الحزم الخلفية
composer install

# 3. إعداد ملف البيئة والمفتاح السري
cp .env.example .env
php artisan key:generate

# 4. إعداد قاعدة البيانات وتهيئة الصلاحيات والمتاجر التجريبية
php artisan migrate --seed

# 5. تثبيت حزم الواجهة الأمامية وبنائها
npm install
npm run build # أو npm run dev للتطوير الحي

# 6. فحص جاهزية النظام
php artisan nova:health

# 7. تشغيل خادم التطوير المحلي
php artisan serve
```

---

## 🧪 أوامر التشغيل والصيانة (Operational Commands)

يوفر النظام أوامر Artisan مخصصة لإدارة العمليات في بيئة الإنتاج:

```bash
# فحص الصحة التشغيلية الشامل لقاعدة البيانات والمخزون والتخزين والذكاء الاصطناعي
php artisan nova:health

# إنشاء لقطة نسخ احتياطي فورية لقاعدة البيانات وحفظها في التخزين الآمن
php artisan nova:backup --retention-days=14

# تشغيل حزمة الاختبارات الشاملة (155 اختباراً مؤكداً)
php artisan test
```

---

## 📚 التوثيق المرجعي ودليل التسليم (Documentation)

تم إعداد وتجهيز أدلة تشغيلية مفصلة في مجلد `docs/`:

1. [**دليل النشر للإنتاج (Production Deployment)**](file:///docs/PRODUCTION_DEPLOYMENT.md) — إرشادات إعداد سيرفر الإنتاج (NGINX, PHP-FPM, MySQL, SSL, Supervisor).
2. [**دليل الأمان والحماية (Security & Hardening)**](file:///docs/SECURITY.md) — هيكل عزل المستأجرين، الصلاحيات، الرؤوس الأمنية، وحماية الذكاء الاصطناعي من الحقن.
3. [**دليل النسخ الاحتياطي والتعافي (Backup & Recovery)**](file:///docs/BACKUP_AND_RECOVERY.md) — استراتيجيات النسخ الدوري لقواعد البيانات والوسائط واستعادتها عند الطوارئ.
4. [**دليل تسليم العميل ونقل الملكية (Customer Handover)**](file:///docs/CUSTOMER_HANDOVER.md) — قائمة تسليم النطاقات، السيرفرات، الحسابات الإدارية، والتكاليف التشغيلية المقدرة.
5. [**دليل أنماط النشر المعمارية (Deployment Modes)**](file:///docs/DEPLOYMENT_MODES.md) — مقارنة تقنية بين نمط المتجر المستقل (`standalone`) ونمط المتاجر المستضافة (`hosted`).

---

## 📄 الترخيص (License)

جميع الحقوق محفوظة © 2026 **منصة NOVA للتجارة الذكية (NOVA Commerce Platform)**.
