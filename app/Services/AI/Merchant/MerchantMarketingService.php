<?php

namespace App\Services\AI\Merchant;

use App\Models\Product;
use App\Models\Tenant;
use App\Services\AI\Providers\GeminiProvider;
use App\Services\AI\Providers\OpenAIProvider;
use Illuminate\Support\Facades\Log;

class MerchantMarketingService
{
    protected DeterministicMerchantEngine $deterministicEngine;
    protected OpenAIProvider $openAiProvider;
    protected GeminiProvider $geminiProvider;

    public function __construct(
        ?DeterministicMerchantEngine $deterministicEngine = null,
        ?OpenAIProvider $openAiProvider = null,
        ?GeminiProvider $geminiProvider = null
    ) {
        $this->deterministicEngine = $deterministicEngine ?: new DeterministicMerchantEngine();
        $this->openAiProvider = $openAiProvider ?: new OpenAIProvider();
        $this->geminiProvider = $geminiProvider ?: new GeminiProvider();
    }

    /**
     * Generate marketing campaign ideas and social media drafts.
     *
     * @param Tenant $tenant
     * @param array{
     *     theme?: string|null,
     *     target_audience?: string|null,
     *     product_ids?: array<int>|null,
     *     goal?: string|null
     * } $params
     * @return array
     */
    public function generateCampaigns(Tenant $tenant, array $params = []): array
    {
        $theme = $params['theme'] ?? 'general';
        $goal = $params['goal'] ?? 'زيادة المبيعات والوعي بالعلامة التجارية';
        $targetAudience = $params['target_audience'] ?? 'المتسوقون والمهتمون بالجودة في السعودية';

        // 1. Fetch active products for this tenant
        $productQuery = Product::where('tenant_id', $tenant->id)
            ->where('status', 'active');

        if (!empty($params['product_ids'])) {
            $productQuery->whereIn('id', array_map('intval', $params['product_ids']));
        } else {
            $productQuery->latest()->limit(8);
        }

        $products = $productQuery->get(['id', 'name', 'price', 'sku'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->price,
            ])
            ->toArray();

        $marketingContext = [
            'store_name' => $tenant->name,
            'currency' => $tenant->currency ?: 'SAR',
            'theme' => $theme,
            'goal' => $goal,
            'target_audience' => $targetAudience,
            'products' => $products,
        ];

        // 2. Build prompt
        $systemPrompt = $this->buildSystemPrompt($tenant, $marketingContext);

        $messages = [
            [
                'role' => 'user',
                'content' => "اقترح أفكار حملات تسويقية ومسودات منشورات لمنصات التواصل الاجتماعي تناسب موسم {$theme} وهدف {$goal}.",
            ],
        ];

        $options = [
            'context_type' => 'marketing',
            'marketing_data' => $marketingContext,
            'theme' => $theme,
            'max_tokens' => 950,
            'temperature' => 0.45,
        ];

        // 3. Dispatch to AI with fallback
        [$generatedText, $providerUsed, $providerStatus] = $this->dispatchWithFallback($systemPrompt, $messages, $options);

        // 4. Parse JSON
        $parsed = $this->parseOutput($generatedText, $marketingContext);

        return [
            'status' => 'success',
            'theme' => $theme,
            'goal' => $goal,
            'disclaimer' => 'جميع المقترحات هي مسودات وأفكار استرشادية، ولا يتم نشر أي محتوى تلقائياً.',
            'featured_products' => $products,
            'drafts' => $parsed,
            'provider' => $providerUsed,
            'provider_status' => $providerStatus,
        ];
    }

    /**
     * Build prompt for marketing ideas.
     */
    protected function buildSystemPrompt(Tenant $tenant, array $context): string
    {
        $contextJson = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        return <<<PROMPT
أنت "مستشار التسويق الرقمي وصناعة الحملات" المعتمد لمنصة التجارة الإلكترونية NOVA.
تساعد تاجر المتجر في ابتكار أفكار حملات ترويجية مميزة ومسودات منشورات لمنصات التواصل الاجتماعي (X / تويتر، إنستغرام، تيك توك / ريلز).

القواعد الإلزامية الصارمة:
1. استخدم فقط أسماء المنتجات الحقيقية المسجلة بالمتجر الواردة في القائمة.
2. لا تخترع نسب خصم حقيقية أو تدعي وجود عروض مفعلة ما لم يحددها التاجر؛ اقترح أفكار العروض كمسودات ومقترحات (Drafts).
3. خاطب الجمهور الخليجي والسعودي بلهجة راقية ومحفزة تتناسب مع ثقافة التسوق المحلية.
4. أرجع النتيجة في صيغة كائن JSON فقط وبدون أي مقدمات أو علامات نصية خارج الـ JSON.

الصيغة المطلوبة (JSON):
{
  "campaign_ideas": [
    {
      "name": "اسم الحملة المقترح",
      "target_audience": "الفئة المستهدفة",
      "angle": "الزاوية التسويقية وفكرة الحملة",
      "headline": "العنوان الإعلاني الرئيسي",
      "suggested_products": ["اسم المنتج 1", "اسم المنتج 2"],
      "call_to_action": "دعوة لاتخاذ إجراء (CTA)"
    }
  ],
  "social_media_posts": [
    {
      "platform": "منصة النشر (مثل X أو Instagram أو TikTok)",
      "copy": "نص المنشور الكامل متضمناً الهاشتاقات المناسبة"
    }
  ],
  "promotional_hooks": [
    "عبارة ترويجية ملفتة 1",
    "عبارة ترويجية ملفتة 2"
  ]
}

سياق المتجر والمنتجات الحقيقية:
```json
{$contextJson}
```
PROMPT;
    }

    /**
     * Dispatch to providers with fallback.
     */
    protected function dispatchWithFallback(string $systemPrompt, array $messages, array $options): array
    {
        $configuredProvider = config('nova.ai.provider', 'auto');

        if (in_array($configuredProvider, ['openai', 'auto'], true) && $this->openAiProvider->isConfigured()) {
            try {
                $result = $this->openAiProvider->chat($systemPrompt, $messages, $options);
                if ($result['status'] === 'success' && !empty($result['content'])) {
                    return [$result['content'], 'openai', 'live'];
                }
            } catch (\Throwable $e) {
                Log::warning('OpenAI marketing call failed: ' . $e->getMessage());
            }
        }

        if (in_array($configuredProvider, ['gemini', 'auto'], true) && $this->geminiProvider->isConfigured()) {
            try {
                $result = $this->geminiProvider->chat($systemPrompt, $messages, $options);
                if ($result['status'] === 'success' && !empty($result['content'])) {
                    return [$result['content'], 'gemini', 'live'];
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini marketing call failed: ' . $e->getMessage());
            }
        }

        $result = $this->deterministicEngine->chat($systemPrompt, $messages, $options);

        return [
            $result['content'],
            'deterministic',
            'fallback',
        ];
    }

    /**
     * Parse JSON output.
     */
    protected function parseOutput(string $output, array $context): array
    {
        $clean = preg_replace('/^```(?:json)?\s*/i', '', trim($output));
        $clean = preg_replace('/\s*```$/', '', $clean);

        $decoded = json_decode($clean, true);

        if (is_array($decoded) && isset($decoded['campaign_ideas'])) {
            return $decoded;
        }

        // Fallback structure
        $engine = new DeterministicMerchantEngine();
        $fallbackJson = $engine->generateMarketingContent($context, []);
        return json_decode($fallbackJson, true) ?: [];
    }
}
