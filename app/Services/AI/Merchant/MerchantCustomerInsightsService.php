<?php

namespace App\Services\AI\Merchant;

use App\Models\Tenant;
use App\Services\AI\Providers\GeminiProvider;
use App\Services\AI\Providers\OpenAIProvider;
use Illuminate\Support\Facades\Log;

class MerchantCustomerInsightsService
{
    protected MerchantAnalyticsAggregator $aggregator;
    protected DeterministicMerchantEngine $deterministicEngine;
    protected OpenAIProvider $openAiProvider;
    protected GeminiProvider $geminiProvider;

    public function __construct(
        ?MerchantAnalyticsAggregator $aggregator = null,
        ?DeterministicMerchantEngine $deterministicEngine = null,
        ?OpenAIProvider $openAiProvider = null,
        ?GeminiProvider $geminiProvider = null
    ) {
        $this->aggregator = $aggregator ?: new MerchantAnalyticsAggregator();
        $this->deterministicEngine = $deterministicEngine ?: new DeterministicMerchantEngine();
        $this->openAiProvider = $openAiProvider ?: new OpenAIProvider();
        $this->geminiProvider = $geminiProvider ?: new GeminiProvider();
    }

    /**
     * Get aggregated, privacy-conscious customer behavior insights.
     *
     * @param Tenant $tenant
     * @return array
     */
    public function getCustomerInsights(Tenant $tenant): array
    {
        // 1. Compute aggregate metrics without exposing any personal data
        $customerData = $this->aggregator->getAggregatedCustomerInsights($tenant);

        // 2. Build prompt
        $systemPrompt = $this->buildSystemPrompt($tenant, $customerData);

        $messages = [
            [
                'role' => 'user',
                'content' => 'قدم تحليلاً استراتيجياً مجمعاً لسلوك العملاء، ونسبة تكرار الشراء، وفرص رفع معدلات الاحتفاظ والولاء.',
            ],
        ];

        $options = [
            'context_type' => 'customer_insights',
            'customer_data' => $customerData,
            'max_tokens' => 700,
            'temperature' => 0.3,
        ];

        // 3. Dispatch to AI with fallback
        [$aiAnalysis, $providerUsed, $providerStatus] = $this->dispatchWithFallback($systemPrompt, $messages, $options);

        return [
            'status' => 'success',
            'privacy_notice' => 'هذه التحليلات تعتمد حصرياً على بيانات مجمعة ومجهولة الهوية دون معالجة أي بيانات شخصية حساسة.',
            'overview' => $customerData['overview'],
            'customer_segments' => $customerData['customer_segments'],
            'geographic_distribution' => $customerData['geographic_distribution'],
            'category_preferences' => $customerData['category_preferences'],
            'reliability' => $customerData['reliability'],
            'ai_insights' => $aiAnalysis,
            'provider' => $providerUsed,
            'provider_status' => $providerStatus,
        ];
    }

    /**
     * Build prompt for customer insights.
     */
    protected function buildSystemPrompt(Tenant $tenant, array $customerData): string
    {
        $dataJson = json_encode([
            'store_name' => $tenant->name,
            'currency' => $customerData['overview']['currency'] ?? 'SAR',
            'total_customers' => $customerData['overview']['total_unique_customers'],
            'repeat_purchase_rate' => $customerData['overview']['repeat_purchase_rate'],
            'customer_segments' => $customerData['customer_segments'],
            'top_cities' => $customerData['geographic_distribution'],
            'top_categories' => $customerData['category_preferences'],
            'reliability' => $customerData['reliability'],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        return <<<PROMPT
أنت "مستشار نمو علاقات العملاء (CRM) وتحليل سلوك المستهلك" في منصة التجارة الإلكترونية NOVA.
تساعد تاجر المتجر في فهم الأنماط الشرائية المجمعة لعملائه لتعزيز ولائهم وتكرار شرائهم.

القواعد الإلزامية الصارمة:
1. التزم بدقة بالأرقام المجمعة (معدل تكرار الشراء، وتوزيع الفئات، وأهم المدن).
2. لا تطلق افتراضات ديموغرافية غير مدعومة بالبيانات (مثل تخمين الأعمار أو الدخل الفردي).
3. وضح للتاجر مستوى موثوقية العينة إذا كان حجم العملاء صغيراً (أقل من 20 عميلاً).
4. قدم مقترحات عملية لزيادة تكرار الشراء (Repeat Purchases) ورفع متوسط الإنفاق.

البيانات الإحصائية المجمعة:
```json
{$dataJson}
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
                Log::warning('OpenAI customer insights call failed: ' . $e->getMessage());
            }
        }

        if (in_array($configuredProvider, ['gemini', 'auto'], true) && $this->geminiProvider->isConfigured()) {
            try {
                $result = $this->geminiProvider->chat($systemPrompt, $messages, $options);
                if ($result['status'] === 'success' && !empty($result['content'])) {
                    return [$result['content'], 'gemini', 'live'];
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini customer insights call failed: ' . $e->getMessage());
            }
        }

        $result = $this->deterministicEngine->chat($systemPrompt, $messages, $options);

        return [
            $result['content'],
            'deterministic',
            'fallback',
        ];
    }
}
