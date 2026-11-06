<?php

namespace App\Services\AI\Merchant;

use App\Models\Product;
use App\Models\Tenant;
use App\Services\AI\Providers\GeminiProvider;
use App\Services\AI\Providers\OpenAIProvider;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class MerchantProductContentService
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
     * Generate or enhance product content, SEO metadata, and titles.
     *
     * @param Tenant $tenant
     * @param array{
     *     product_id?: int|null,
     *     name: string,
     *     category_name?: string|null,
     *     price?: float|null,
     *     current_description?: string|null,
     *     key_features?: string|null,
     *     tone?: string|null,
     *     target_audience?: string|null
     * } $data
     * @return array
     */
    public function generateContent(Tenant $tenant, array $data): array
    {
        // 1. If product_id is provided, verify it belongs to this tenant
        if (!empty($data['product_id'])) {
            $product = Product::where('id', $data['product_id'])
                ->where('tenant_id', $tenant->id)
                ->first();

            if (!$product) {
                abort(Response::HTTP_NOT_FOUND, 'المنتج المحدد غير موجود أو لا ينتمي لهذا المتجر.');
            }

            // Enrich data with actual verified product attributes
            $data['name'] = $product->name;
            $data['category_name'] = $product->category?->name ?: ($data['category_name'] ?? 'عام');
            $data['price'] = (float) $product->price;
            $data['sku'] = $product->sku;
            if (empty($data['current_description'])) {
                $data['current_description'] = $product->description;
            }
        }

        $tone = $data['tone'] ?? 'professional';
        $targetAudience = $data['target_audience'] ?? 'المتسوقون في المملكة والخليج';

        // 2. Build structured prompt
        $systemPrompt = $this->buildSystemPrompt($tenant, $data, $tone, $targetAudience);

        $messages = [
            [
                'role' => 'user',
                'content' => "يرجى توليد نصوص تسويقية، عناوين مقترحة، وأوصاف سيو (SEO) احترافية للمنتج بناءً على المعلومات المقدمة فقط وبنبرة: {$tone}.",
            ],
        ];

        $options = [
            'context_type' => 'product_content',
            'product_data' => $data,
            'tone' => $tone,
            'max_tokens' => 900,
            'temperature' => 0.4,
        ];

        // 3. Dispatch to AI with fallback
        [$generatedText, $providerUsed, $providerStatus] = $this->dispatchWithFallback($systemPrompt, $messages, $options);

        // 4. Parse JSON if possible or wrap safely
        $parsed = $this->parseOutput($generatedText, $data);

        return [
            'status' => 'success',
            'product_id' => $data['product_id'] ?? null,
            'original_attributes' => [
                'name' => $data['name'],
                'category_name' => $data['category_name'] ?? null,
                'price' => $data['price'] ?? null,
                'current_description' => $data['current_description'] ?? null,
            ],
            'generated_content' => $parsed,
            'provider' => $providerUsed,
            'provider_status' => $providerStatus,
        ];
    }

    /**
     * Build system prompt for writing assistance.
     */
    protected function buildSystemPrompt(Tenant $tenant, array $data, string $tone, string $audience): string
    {
        $productJson = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        return <<<PROMPT
أنت "مساعد صياغة وتسويق المنتجات" في منصة التجارة الإلكترونية NOVA.
مهمتك كتابة محتوى تسويقي عربي جذاب واحترافي لمنتجات المتجر وتحسين محركات البحث (SEO).

القواعد الإلزامية الصارمة:
1. استخدم فقط المواصفات والميزات الحقيقية المقدمة في بيانات المنتج أدناه.
2. لا تخترع شهادات جودة، أو مواد تصنيع، أو سنوات ضمان، أو فوائد طبية/تقنية لم يذكرها التاجر.
3. التزم بالنبرة المطلوبة: {$tone} واستهداف الجمهور: {$audience}.
4. أرجع النتيجة في صيغة كائن JSON فقط وبدون أي مقدمات أو علامات نصية خارج الـ JSON.

الصيغة المطلوبة (JSON):
{
  "suggested_titles": ["عنوان 1", "عنوان 2", "عنوان 3"],
  "short_description": "وصف تسويقي موجز لا يتجاوز 150 حرفاً يبرز أهم ميزة",
  "long_description": "وصف تسويقي تفصيلي شامل في 2-3 فقرات بأسلوب بليغ",
  "seo_title": "عنوان محسن لمحركات البحث (أقل من 60 حرفاً)",
  "seo_description": "وصف ميتا مخصص لمحركات البحث (أقل من 160 حرفاً)",
  "keywords": "كلمات مفتاحية مفصولة بفواصل",
  "bullet_points": ["ميزة 1", "ميزة 2", "ميزة 3"]
}

بيانات المنتج الحالية:
```json
{$productJson}
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
                Log::warning('OpenAI product content call failed: ' . $e->getMessage());
            }
        }

        if (in_array($configuredProvider, ['gemini', 'auto'], true) && $this->geminiProvider->isConfigured()) {
            try {
                $result = $this->geminiProvider->chat($systemPrompt, $messages, $options);
                if ($result['status'] === 'success' && !empty($result['content'])) {
                    return [$result['content'], 'gemini', 'live'];
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini product content call failed: ' . $e->getMessage());
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
     * Safely parse JSON output or fall back to structured representation.
     */
    protected function parseOutput(string $output, array $fallbackData): array
    {
        // Try cleaning json backticks ```json ... ```
        $clean = preg_replace('/^```(?:json)?\s*/i', '', trim($output));
        $clean = preg_replace('/\s*```$/', '', $clean);

        $decoded = json_decode($clean, true);

        if (is_array($decoded) && isset($decoded['short_description'])) {
            return $decoded;
        }

        // Fallback using deterministic engine format
        $name = $fallbackData['name'] ?? 'المنتج';
        return [
            'suggested_titles' => [
                "{$name} - جودة أصلية ممتازة",
                "{$name} - الخيار الأفضل لاحتياجاتك",
            ],
            'short_description' => "استمتع بالجودة والأداء المتميز مع {$name}.",
            'long_description' => strip_tags($output),
            'seo_title' => "شراء {$name} أونلاين بأفضل سعر",
            'seo_description' => "احصل على {$name} مع ضمان الجودة وتوصيل سريع حتى باب منزلك.",
            'keywords' => "{$name}, تسوق أونلاين, منتجات أصلية",
            'bullet_points' => [
                'جودة عالية وتصميم متميز.',
                'مطابق للمواصفات المعتمدة.',
            ],
        ];
    }
}
