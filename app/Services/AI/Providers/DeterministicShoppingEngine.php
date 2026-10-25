<?php

namespace App\Services\AI\Providers;

use App\Services\AI\Contracts\AIProviderInterface;

class DeterministicShoppingEngine implements AIProviderInterface
{
    public function isConfigured(): bool
    {
        return true;
    }

    public function getName(): string
    {
        return 'deterministic';
    }

    public function chat(string $systemPrompt, array $messages, array $options = []): array
    {
        $lastUserMessage = '';
        for ($i = count($messages) - 1; $i >= 0; $i--) {
            if (($messages[$i]['role'] ?? '') === 'user') {
                $lastUserMessage = trim((string) ($messages[$i]['content'] ?? ''));
                break;
            }
        }

        // Parse products catalog json from system prompt if embedded
        $catalog = $options['catalog'] ?? [];
        $policies = $options['policies'] ?? [];
        $currency = $options['currency'] ?? 'SAR';
        $storeName = $options['store_name'] ?? 'متجرنا';

        $query = mb_strtolower($lastUserMessage, 'UTF-8');

        // 1. Check for Store Policy Queries (Shipping, Return, Payment)
        if (preg_match('/(شحن|توصيل|مدة التوصيل|delivery|shipping)/iu', $query)) {
            $shippingPolicy = $policies['shipping_policy'] ?? 'نوفر شحن سريع وتوصيل آمن لجميع مدن المملكة ودول الخليج خلال 24-48 ساعة عمل، والشحن مجاني للطلبات المؤهلة.';
            return [
                'content' => "أهلاً بك! بخصوص الشحن والتوصيل في {$storeName}:\n\n{$shippingPolicy}\n\nهل تود استعراض أي منتجات محددة للطلب الآن؟",
                'provider' => $this->getName(),
                'model' => 'rule-engine',
                'status' => 'success',
                'error' => null,
            ];
        }

        if (preg_match('/(استرجاع|استبدال|ترجيع|return|refund)/iu', $query)) {
            $returnPolicy = $policies['return_policy'] ?? 'نوفر سياسة استبدال واسترجاع مرنة خلال 14 يوماً من استلام الطلب وفق الشروط والأحكام.';
            return [
                'content' => "مرحباً بك! سياسة الاسترجاع والاستبدال المعتمدة لدى {$storeName}:\n\n{$returnPolicy}\n\nيسعدنا مساعدتك في اختيار المنتج الأنسب لك لتفادي أي استبدال!",
                'provider' => $this->getName(),
                'model' => 'rule-engine',
                'status' => 'success',
                'error' => null,
            ];
        }

        if (preg_match('/(دفع|طرق الدفع|مدى|فيزا|تقسيط|payment|cod)/iu', $query)) {
            return [
                'content' => "نوفر خيارات دفع إلكتروني آمنة ومتعددة تشمل: مدى (Mada)، البطاقات الائتمانية (Visa / Mastercard)، والدفع عند الاستلام.\n\nتتم معالجة كافة المعاملات المالية بتشفير بنكي عالي الأمان.",
                'provider' => $this->getName(),
                'model' => 'rule-engine',
                'status' => 'success',
                'error' => null,
            ];
        }

        // 2. Budget extraction (e.g. "أقل من 200", "بميزانية 300", "تحت 150")
        $maxBudget = null;
        if (preg_match('/(أقل من|تحت|بحدود|ميزانية|سعر|ريال)\s*(\d+)/iu', $query, $matches)) {
            $maxBudget = (float) $matches[2];
        } elseif (preg_match('/(\d+)\s*(ريال|sar)/iu', $query, $matches)) {
            $maxBudget = (float) $matches[1];
        }

        // 3. Match relevant products from catalog
        $matchedProducts = [];
        foreach ($catalog as $item) {
            $pName = mb_strtolower($item['name'] ?? '', 'UTF-8');
            $pDesc = mb_strtolower($item['description'] ?? '', 'UTF-8');
            $pCat = mb_strtolower($item['category'] ?? '', 'UTF-8');
            $pPrice = (float) ($item['price'] ?? 0);

            // Budget filter if specified
            if ($maxBudget !== null && $pPrice > $maxBudget) {
                continue;
            }

            // Keyword scoring
            $score = 0;
            $words = array_filter(explode(' ', $query));
            foreach ($words as $word) {
                if (mb_strlen($word) < 2) continue;
                if (str_contains($pName, $word)) $score += 4;
                if (str_contains($pCat, $word)) $score += 3;
                if (str_contains($pDesc, $word)) $score += 1;
            }

            if ($score > 0 || ($maxBudget !== null && $pPrice <= $maxBudget)) {
                $matchedProducts[] = [
                    'product' => $item,
                    'score' => $score,
                    'price' => $pPrice,
                ];
            }
        }

        // Sort by score desc, then price asc
        usort($matchedProducts, function ($a, $b) {
            if ($a['score'] === $b['score']) {
                return $a['price'] <=> $b['price'];
            }
            return $b['score'] <=> $a['score'];
        });

        // 4. Comparison requests
        if (preg_match('/(قارن|مقارنة|الفرق بين|أفضل)/iu', $query) && count($matchedProducts) >= 2) {
            $p1 = $matchedProducts[0]['product'];
            $p2 = $matchedProducts[1]['product'];

            $reply = "بكل سرور! إليك مقارنة سريعة بين المنتجات الأكثر طلباً في متجرنا:\n\n";
            $reply .= "1️⃣ **{$p1['name']}**\n- السعر: {$p1['price']} {$currency}\n- المخزون: " . ($p1['stock_quantity'] > 0 ? "متوفر ({$p1['stock_quantity']} قطعة)" : "نافد حالياً") . "\n- المعرف: [[PRODUCT:{$p1['id']}]]\n\n";
            $reply .= "2️⃣ **{$p2['name']}**\n- السعر: {$p2['price']} {$currency}\n- المخزون: " . ($p2['stock_quantity'] > 0 ? "متوفر ({$p2['stock_quantity']} قطعة)" : "نافد حالياً") . "\n- المعرف: [[PRODUCT:{$p2['id']}]]\n\n";
            $reply .= "أي منهما يناسب احتياجك وميزانيتك بشكل أكبر؟";

            return [
                'content' => $reply,
                'provider' => $this->getName(),
                'model' => 'rule-engine',
                'status' => 'success',
                'error' => null,
            ];
        }

        // 5. Products Found
        if (!empty($matchedProducts)) {
            $topHits = array_slice($matchedProducts, 0, 3);
            $reply = "وجدت لك أفضل الخيارات المتاحة حالياً في {$storeName}";
            if ($maxBudget !== null) {
                $reply .= " بميزانية في حدود {$maxBudget} {$currency}";
            }
            $reply .= ":\n\n";

            foreach ($topHits as $hit) {
                $p = $hit['product'];
                $stockStatus = $p['stock_quantity'] > 0 ? "متوفر" : "نافد من المخزون";
                $reply .= "✨ **{$p['name']}** — بسعر **{$p['price']} {$currency}** ({$stockStatus})\n";
                if (!empty($p['description'])) {
                    $reply .= "   " . mb_substr($p['description'], 0, 90) . "...\n";
                }
                $reply .= "   [[PRODUCT:{$p['id']}]]\n\n";
            }

            $reply .= "هل تود معرفة تفاصيل إضافية أو مقارنة أي منها؟";

            return [
                'content' => $reply,
                'provider' => $this->getName(),
                'model' => 'rule-engine',
                'status' => 'success',
                'error' => null,
            ];
        }

        // 6. Generic or ambiguous requests (Clarifying question)
        if (mb_strlen($query) < 4 || preg_match('/^(مرحبا|سلام|أهلا|الو|هاي|مساء الخير|صباح الخير)/iu', $query)) {
            return [
                'content' => "أهلاً وسهلاً بك في {$storeName}! 👋\n\nأنا مساعدك الذكي للتسوق. يمكنني مساعدتك في العثور على المنتجات المناسبة، مقارنة الأسعار والمواصفات، أو تقديم اقتراحات هدايا تناسب ميزانيتك.\n\nما الذي تبحث عنه اليوم؟ (مثال: 'اقترح لي منتجات أقل من 200 ريال' أو 'ابحث عن قهوة مختصة')",
                'provider' => $this->getName(),
                'model' => 'rule-engine',
                'status' => 'success',
                'error' => null,
            ];
        }

        // 7. No products matched
        return [
            'content' => "لم أعثر على منتجات تطابق تماماً بحثك عن '{$lastUserMessage}' في المتجر حالياً. هل يمكنك توضيح ما تبحث عنه بتفاصيل أكثر، أو تحديد الفئة السعرية المناسبة لك؟",
            'provider' => $this->getName(),
            'model' => 'rule-engine',
            'status' => 'success',
            'error' => null,
        ];
    }
}
