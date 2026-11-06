<?php

namespace App\Services\AI\Merchant;

use App\Services\AI\Contracts\AIProviderInterface;

class DeterministicMerchantEngine implements AIProviderInterface
{
    public function isConfigured(): bool
    {
        return true;
    }

    public function getName(): string
    {
        return 'deterministic';
    }

    /**
     * Provide grounded, deterministic AI responses for merchant queries.
     */
    public function chat(string $systemPrompt, array $messages, array $options = []): array
    {
        $lastMessage = end($messages);
        $userQuery = (string) ($lastMessage['content'] ?? '');
        $contextType = $options['context_type'] ?? 'general';

        switch ($contextType) {
            case 'product_content':
                $content = $this->generateProductContent($options['product_data'] ?? [], $options);
                break;

            case 'marketing':
                $content = $this->generateMarketingContent($options['marketing_data'] ?? [], $options);
                break;

            case 'inventory':
                $content = $this->generateInventoryAnalysis($options['inventory_data'] ?? []);
                break;

            case 'customer_insights':
                $content = $this->generateCustomerInsightsAnalysis($options['customer_data'] ?? []);
                break;

            case 'bi_chat':
            default:
                $content = $this->generateBusinessIntelligenceReply($userQuery, $options['metrics_data'] ?? []);
                break;
        }

        return [
            'content' => $content,
            'provider' => $this->getName(),
            'model' => 'nova-deterministic-v1',
            'status' => 'success',
            'error' => null,
        ];
    }

    /**
     * Generate structured BI responses based strictly on computed metrics.
     */
    public function generateBusinessIntelligenceReply(string $query, array $metrics): array|string
    {
        $curr = $metrics['current'] ?? [];
        $comp = $metrics['comparison'] ?? null;
        $currency = $metrics['tenant']['currency'] ?? 'SAR';
        $revenue = number_format($curr['revenue'] ?? 0, 2);
        $ordersCount = $curr['orders_count'] ?? 0;
        $aov = number_format($curr['average_order_value'] ?? 0, 2);
        $topSellers = $metrics['top_sellers'] ?? [];

        $reply = "### ملخص الأداء المالي والتشغيلي الموثق\n\n";
        $reply .= "- **إجمالي الإيرادات المؤكدة:** {$revenue} {$currency}\n";
        $reply .= "- **عدد الطلبات الإجمالي:** {$ordersCount} طلب\n";
        $reply .= "- **متوسط قيمة الطلب (AOV):** {$aov} {$currency}\n\n";

        if ($comp) {
            $growth = $comp['revenue_growth_percentage'] ?? 0;
            $sign = $growth >= 0 ? '+' : '';
            $reply .= "### مقارنة الأداء بالفترة السابقة\n\n";
            $reply .= "- **نسبة نمو الإيرادات:** {$sign}{$growth}%\n";
            $reply .= "- **نمو عدد الطلبات:** " . ($comp['orders_growth_percentage'] >= 0 ? '+' : '') . "{$comp['orders_growth_percentage']}%\n\n";
        }

        if (!empty($topSellers)) {
            $reply .= "### المنتجات الأكثر مبيعاً وتحقيقاً للإيراد\n\n";
            foreach (array_slice($topSellers, 0, 3) as $idx => $item) {
                $num = $idx + 1;
                $reply .= "{$num}. **{$item['name']}** — بيع منه {$item['units_sold']} وحدة بإجمالي " . number_format($item['revenue'], 2) . " {$currency}.\n";
            }
            $reply .= "\n";
        }

        $reply .= "### التوصيات الاستراتيجية الذكية المقترحة\n\n";
        if ($ordersCount === 0) {
            $reply .= "- لم تسجل طلبات مكتملة خلال هذه الفترة. يُنصح بمراجعة أسعار المعروضات وإطلاق حملات ترويجية للمنتجات المميزة.\n";
            $reply .= "- التحقق من تفعيل خيارات الدفع الإلكتروني (مدى و Apple Pay) لجذب المتسوقين.\n";
        } else {
            $reply .= "- التركيز على المنتجات الأكثر طلباً في الحملات الإعلانية ومجموعات الباقات لرفع متوسط قيمة الطلب.\n";
            $reply .= "- متابعة مستويات المخزون للمنتجات النشطة لتفادي نفاد الكميات وتوقف المبيعات.\n";
        }

        return $reply;
    }

    /**
     * Generate professional product descriptions and SEO metadata.
     */
    public function generateProductContent(array $product, array $options): string
    {
        $name = $product['name'] ?? 'المنتج';
        $category = $product['category_name'] ?? 'العام';
        $price = $product['price'] ?? 0;
        $tone = $options['tone'] ?? 'professional';

        $titleOptions = [
            "{$name} - إصدار أصلي فاخر",
            "{$name} عالي الجودة والأناقة",
            "أفضل خيار من {$name} في تصنيف {$category}",
        ];

        $seoTitle = "شراء {$name} بأفضل سعر | ضمان وتوصيل سريع";
        $seoDescription = "تسوق الآن {$name} في قسم {$category}. جودة مضمونة وسعر مميز مع شحن سريع وآمن حتى باب منزلك.";
        $keywords = "{$name}, {$category}, شراء {$name}, عروض {$name}, منتجات أصلية";

        $shortDesc = "قطعة مميزة من {$name} تجمع بين الجودة العالية والتصميم العصري لتلبي تطلعاتك اليومية في قسم {$category}.";
        
        $longDesc = "نقدم لك **{$name}** المصمم بعناية فائقة ليوفر أقصى درجات الرضا والاعتمادية. "
            . "يتميز هذا المنتج بالمتانة والأناقة، مما يجعله الخيار المثالي في تصنيف {$category}. "
            . "سواء كنت تبحث عن الأداء العملي أو المظهر الراقي، يمنحك {$name} القيمة التي تستحقها وبسعر تنافسي يبلغ {$price} ريال مع تغليف آمن وضمان كامل.";

        $result = [
            'suggested_titles' => $titleOptions,
            'short_description' => $shortDesc,
            'long_description' => $longDesc,
            'seo_title' => $seoTitle,
            'seo_description' => $seoDescription,
            'keywords' => $keywords,
            'bullet_points' => [
                "خامة متميزة وتصميم أنيق مناسب للاقتناء اليومي.",
                "مطابق للمواصفات ومعايير الجودة المعتمدة في المملكة.",
                "قيمة استثنائية مقابل السعر مع سهولة الاستخدام.",
            ],
        ];

        return json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    /**
     * Generate marketing campaigns, social media copy, and promotional ideas.
     */
    public function generateMarketingContent(array $marketingData, array $options): string
    {
        $theme = $options['theme'] ?? 'general';
        $storeName = $marketingData['store_name'] ?? 'المتجر';
        $featuredProducts = $marketingData['products'] ?? [];

        $productNames = array_map(fn ($p) => $p['name'], array_slice($featuredProducts, 0, 3));
        $productsMention = !empty($productNames) ? implode('، ', $productNames) : 'أفضل معروضاتنا المختارة';

        $campaigns = [
            [
                'name' => 'حملة النخبة الموسمية',
                'target_audience' => 'الباحثون عن التميز والجودة',
                'angle' => 'الجودة الأصلية والتجربة الاستثنائية',
                'headline' => "اختر الأفضل مع تشكيلة {$storeName} الفاخرة!",
                'suggested_products' => $productNames,
                'call_to_action' => 'تسوق الآن واستمتع بالشحن السريع',
            ],
            [
                'name' => 'عروض نهاية الأسبوع الحصرية',
                'target_audience' => 'المتسوقون الباحثون عن عروض القيمة',
                'angle' => 'توفير ذكي مع توصيل مباشر لباب المنزل',
                'headline' => 'عطلة نهاية الأسبوع مميزة مع اختياراتنا الحصرية',
                'suggested_products' => $productNames,
                'call_to_action' => 'اكتشف المجموعة الكاملة قبل نفاد الكمية',
            ],
        ];

        $socialPosts = [
            [
                'platform' => 'X (Twitter)',
                'copy' => "تمتع بتجربة تسوق متكاملة مع {$storeName} 🌟\nنوفر لك {$productsMention} بأعلى معايير الجودة والتوصيل السريع إلى باب بيتك.\n\n🔗 اطلب الآن عبر متجرنا الإلكتروني!",
            ],
            [
                'platform' => 'Instagram',
                'copy' => "الأناقة تلتقي مع الجودة ✨\nاكتشف جديد {$storeName} واختر ما يناسب ذوقك الرفيع من {$productsMention}.\n\n🚚 توصيل سريع لجميع مناطق المملكة.\n#تسوق #عروض #متجر_إلكتروني #السعودية",
            ],
            [
                'platform' => 'TikTok / Reels',
                'copy' => "ليش تختار منتجاتنا؟ 🤔\nلأن الجودة الأصلية والتوصيل السريع مضمون مع {$storeName}! تفقد الرابط في البايو وشوف الجديد بنفسك ✨",
            ],
        ];

        $result = [
            'campaign_ideas' => $campaigns,
            'social_media_posts' => $socialPosts,
            'promotional_hooks' => [
                'جودة تثق بها وتوصيل سريع لباب بيتك.',
                'القطع الأكثر طلباً متوفرة الآن بكميات محدودة.',
                'تسوق بأمان وراحة مع أسرع خدمة عملاء.',
            ],
        ];

        return json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    /**
     * Generate inventory analysis and action suggestions.
     */
    public function generateInventoryAnalysis(array $inventoryData): string
    {
        $summary = $inventoryData['summary'] ?? [];
        $items = $inventoryData['items'] ?? [];

        $outCount = $summary['out_of_stock_count'] ?? 0;
        $critCount = $summary['critical_risk_count'] ?? 0;
        $warnCount = $summary['warning_count'] ?? 0;
        $slowCount = $summary['slow_moving_count'] ?? 0;

        $analysis = "### التقييم التشغيلي لسلامة المخزون\n\n";
        $analysis .= "- **منتجات نفدت تماماً:** {$outCount} منتج يتطلب إعادة التوريد فورياً لاستعادة تدفق المبيعات.\n";
        $analysis .= "- **منتجات في خطر نفاد وشيك (خلال 7 أيام):** {$critCount} منتج لديه معدل سحب يومي قوي مقارنة برصيد المستودع.\n";
        $analysis .= "- **منتجات تحت حد المخزون الأدنى:** {$warnCount} منتج.\n";
        $analysis .= "- **منتجات بطيئة الحركة (30 يوماً بلا مبيعات):** {$slowCount} منتج يمكن تحفيز مبيعاتها عبر الباقات أو التخفيضات.\n\n";

        $analysis .= "### الإجراءات الوقائية المقترحة\n\n";
        $analysis .= "1. التواصل مع الموردين لحجز كميات جديدة للمنتجات عالية الدوران قبل نفادها بالكامل.\n";
        $analysis .= "2. إعادة تسليط الضوء على المنتجات بطيئة الحركة في الصفحة الرئيسية لتدوير السيولة النقدية.\n";

        return $analysis;
    }

    /**
     * Generate customer behavior analysis.
     */
    public function generateCustomerInsightsAnalysis(array $customerData): string
    {
        $overview = $customerData['overview'] ?? [];
        $total = $overview['total_unique_customers'] ?? 0;
        $repeatRate = $overview['repeat_purchase_rate'] ?? 0;
        $segments = $customerData['customer_segments'] ?? [];
        $topCities = $customerData['geographic_distribution'] ?? [];
        $reliability = $customerData['reliability'] ?? [];

        $analysis = "### التحليل المجمع لسلوك المتسوقين\n\n";
        $analysis .= "- **إجمالي قاعدة العملاء المتسوقين:** {$total} عميل فريد.\n";
        $analysis .= "- **معدل تكرار الشراء (Repeat Rate):** {$repeatRate}%\n";
        $analysis .= "- **عملاء القيمة العالية (1000+ ريال):** " . ($segments['high_value'] ?? 0) . " عميل.\n";
        $analysis .= "- **عملاء القيمة المتوسطة (300-1000 ريال):** " . ($segments['mid_value'] ?? 0) . " عميل.\n\n";

        if (!empty($topCities)) {
            $analysis .= "### التوزيع الجغرافي لأعلى المدن طلباً\n\n";
            foreach (array_slice($topCities, 0, 3) as $c) {
                $analysis .= "- **{$c['city']}:** {$c['orders_count']} طلب بإجمالي " . number_format($c['revenue'], 2) . " ريال.\n";
            }
            $analysis .= "\n";
        }

        $analysis .= "### موثوقية العينة والتوصيات\n\n";
        $analysis .= "- **تقييم حجم البيانات:** {$reliability['notice']}\n";
        $analysis .= "- **فرص تعزيز الولاء:** إنشاء برامج مكافآت بسيطة للعملاء الذين كرروا الشراء، واستهداف المدن الأكثر طلباً بحملات إعلانية مخصصة.\n";

        return $analysis;
    }
}
