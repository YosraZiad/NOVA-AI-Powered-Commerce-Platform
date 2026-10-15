<?php

namespace Database\Seeders;

use App\Contracts\TenantContextInterface;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class ProductCatalogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $demoTenant = Tenant::where('slug', 'demo-store')->first();

        if (!$demoTenant) {
            return;
        }

        // Bind demo tenant in context for catalog operations
        if (app()->bound(TenantContextInterface::class)) {
            app(TenantContextInterface::class)->setTenant($demoTenant);
        }

        // 1. Categories
        $electronics = Category::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $demoTenant->id, 'slug' => 'electronics'],
            [
                'name' => 'الأجهزة والصوتيات الذكية',
                'description' => 'أجهزة ذكية وإلكترونيات استثنائية للاستخدام اليومي والعمل المتقدم.',
                'is_active' => true,
            ]
        );

        $apparel = Category::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $demoTenant->id, 'slug' => 'apparel'],
            [
                'name' => 'الأزياء والملابس الفاخرة',
                'description' => 'ملابس يومية راقية ومصنوعة من خامات قطنية طبيعية معتمدة.',
                'is_active' => true,
            ]
        );

        $home = Category::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $demoTenant->id, 'slug' => 'home-living'],
            [
                'name' => 'المنزل والمكتب العصري',
                'description' => 'إكسسوارات عصرية لحياة مريحة ومكتب عمل متكامل.',
                'is_active' => true,
            ]
        );

        $luxury = Category::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $demoTenant->id, 'slug' => 'luxury-fragrances'],
            [
                'name' => 'العطور الفاخرة والعود',
                'description' => 'مخلطات شرقية وروائح ملكية بنفحات العود والعنبر الأصيل.',
                'is_active' => true,
            ]
        );

        $coffee = Category::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $demoTenant->id, 'slug' => 'coffee-lifestyle'],
            [
                'name' => 'القهوة المختصة وأدواتها',
                'description' => 'أدوات تحضير وترشيح القهوة الفاخرة بتصاميم مستوحاة من التراث المعاصر.',
                'is_active' => true,
            ]
        );

        // 2. Products

        // Product 1: Headphones
        $headphones = Product::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $demoTenant->id, 'sku' => 'NOVA-ELEC-001'],
            [
                'category_id' => $electronics->id,
                'name' => 'سماعات رأس لاسلكية عازلة للضوضاء',
                'slug' => 'wireless-noise-cancelling-headphones',
                'description' => 'سماعات احترافية بخاصية العزل الصوتي الفائق وبطارية تدوم حتى 40 ساعة متواصلة مع دعم الشحن السريع.',
                'price' => 749.00,
                'compare_at_price' => 899.00,
                'stock_quantity' => 50,
                'status' => 'active',
            ]
        );

        ProductVariant::updateOrCreate(
            ['product_id' => $headphones->id, 'sku' => 'NOVA-ELEC-001-BLK'],
            [
                'name' => 'أسود مطفي (Midnight Black)',
                'options' => ['color' => 'Black'],
                'price' => 749.00,
                'stock_quantity' => 30,
            ]
        );

        ProductVariant::updateOrCreate(
            ['product_id' => $headphones->id, 'sku' => 'NOVA-ELEC-001-SLV'],
            [
                'name' => 'فضي قطبي (Arctic Silver)',
                'options' => ['color' => 'Silver'],
                'price' => 749.00,
                'stock_quantity' => 20,
            ]
        );

        ProductImage::updateOrCreate(
            ['product_id' => $headphones->id, 'sort_order' => 0],
            [
                'path' => '/images/products/headphones.jpg',
                'alt_text' => 'سماعات رأس لاسلكية عازلة للضوضاء',
            ]
        );

        // Product 2: Smart Speaker
        $speaker = Product::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $demoTenant->id, 'sku' => 'NOVA-ELEC-002'],
            [
                'category_id' => $electronics->id,
                'name' => 'مكبر صوت ذكي ومساعد منزلي صوتي',
                'slug' => 'smart-home-assistant-speaker',
                'description' => 'صوت محيطي 360 درجة نقي وعميق مع دعم التحكم الصوتي الذكي والاتصال بكافة أجهزة المنزل.',
                'price' => 339.00,
                'compare_at_price' => 399.00,
                'stock_quantity' => 35,
                'status' => 'active',
            ]
        );

        ProductImage::updateOrCreate(
            ['product_id' => $speaker->id, 'sort_order' => 0],
            [
                'path' => '/images/products/speaker.jpg',
                'alt_text' => 'مكبر صوت ذكي ومساعد منزلي',
            ]
        );

        // Product 3: Organic Cotton Tee
        $tshirt = Product::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $demoTenant->id, 'sku' => 'NOVA-APP-001'],
            [
                'category_id' => $apparel->id,
                'name' => 'تيشيرت كلاسيكي من القطن العضوي الفاخر',
                'slug' => 'organic-cotton-classic-tee',
                'description' => 'منسوج من قطن عضوي نقي 100% يوفر راحة ونعومة فائقة طوال اليوم، مقاوم للانكماش والبهتان.',
                'price' => 119.00,
                'compare_at_price' => 149.00,
                'stock_quantity' => 120,
                'status' => 'active',
            ]
        );

        ProductVariant::updateOrCreate(
            ['product_id' => $tshirt->id, 'sku' => 'NOVA-APP-001-M-NAV'],
            [
                'name' => 'كحلي داكن / مقاس M',
                'options' => ['color' => 'Navy', 'size' => 'M'],
                'price' => 119.00,
                'stock_quantity' => 60,
            ]
        );

        ProductVariant::updateOrCreate(
            ['product_id' => $tshirt->id, 'sku' => 'NOVA-APP-001-L-BLK'],
            [
                'name' => 'أسود فحمي / مقاس L',
                'options' => ['color' => 'Black', 'size' => 'L'],
                'price' => 119.00,
                'stock_quantity' => 60,
            ]
        );

        ProductImage::updateOrCreate(
            ['product_id' => $tshirt->id, 'sort_order' => 0],
            [
                'path' => '/images/products/tshirt.jpg',
                'alt_text' => 'تيشيرت كلاسيكي من القطن العضوي',
            ]
        );

        // Product 4: Desk Lamp
        $lamp = Product::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $demoTenant->id, 'sku' => 'NOVA-HOME-001'],
            [
                'category_id' => $home->id,
                'name' => 'مصباح مكتبي ذكي مع قاعدة شحن لاسلكي',
                'slug' => 'ergonomic-led-desk-lamp',
                'description' => 'إضاءة صحية مريحة للعين مع تحكم بدرجات حرارة اللون وقاعدة شحن لاسلكي مدمجة للهواتف الذكية.',
                'price' => 189.00,
                'compare_at_price' => 229.00,
                'stock_quantity' => 25,
                'status' => 'active',
            ]
        );

        ProductImage::updateOrCreate(
            ['product_id' => $lamp->id, 'sort_order' => 0],
            [
                'path' => '/images/products/desk-lamp.jpg',
                'alt_text' => 'مصباح مكتبي مريح وشاحن لاسلكي',
            ]
        );

        // Product 5: Royal Oud Perfume
        $oud = Product::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $demoTenant->id, 'sku' => 'NOVA-LUX-001'],
            [
                'category_id' => $luxury->id,
                'name' => 'عطر العود الملكي الفاخر (Royal Oud 50ml)',
                'slug' => 'royal-oud-luxury-perfume',
                'description' => 'توليفة ملكية حصرية تمزج خشب العود الكمبودي النادر بلمسات من العنبر والمسك الأبيض في زجاجة كريستالية أنيقة.',
                'price' => 480.00,
                'compare_at_price' => 590.00,
                'stock_quantity' => 40,
                'status' => 'active',
            ]
        );

        ProductImage::updateOrCreate(
            ['product_id' => $oud->id, 'sort_order' => 0],
            [
                'path' => '/images/products/oud-perfume.jpg',
                'alt_text' => 'عطر العود الملكي الفاخر',
            ]
        );

        // Product 6: Specialty Coffee Set
        $coffeeSet = Product::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $demoTenant->id, 'sku' => 'NOVA-COF-001'],
            [
                'category_id' => $coffee->id,
                'name' => 'طقم تحضير القهوة المختصة سيراميك (Waha Dripper)',
                'slug' => 'waha-specialty-coffee-dripper-set',
                'description' => 'طقم ترشيح قهوة عصري مصنوع من السيراميك الحجري بلون رملي هادئ يتضمن قمع التقطير، إبريق التقديم الزجاجي، وكوب سيراميك مطابق.',
                'price' => 215.00,
                'compare_at_price' => null,
                'stock_quantity' => 65,
                'status' => 'active',
            ]
        );

        ProductImage::updateOrCreate(
            ['product_id' => $coffeeSet->id, 'sort_order' => 0],
            [
                'path' => '/images/products/coffee-set.jpg',
                'alt_text' => 'طقم تحضير القهوة المختصة سيراميك',
            ]
        );

        // Reset tenant context
        if (app()->bound(TenantContextInterface::class)) {
            app(TenantContextInterface::class)->setTenant(null);
        }
    }
}
