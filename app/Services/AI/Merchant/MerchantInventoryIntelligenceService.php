<?php

namespace App\Services\AI\Merchant;

use App\Models\Tenant;
use App\Services\AI\Providers\GeminiProvider;
use App\Services\AI\Providers\OpenAIProvider;
use Illuminate\Support\Facades\Log;

class MerchantInventoryIntelligenceService
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
     * Get inventory intelligence report with verified velocity and AI recommendations.
     *
     * @param Tenant $tenant
     * @return array
     */
    public function getInventoryInsights(Tenant $tenant): array
    {
        // 1. Calculate inventory health from actual database records
        $inventoryData = $this->aggregator->getInventoryIntelligence($tenant);

        // 2. Build prompt for executive interpretation
        $systemPrompt = $this->buildSystemPrompt($tenant, $inventoryData);

        $messages = [
            [
                'role' => 'user',
                'content' => 'قدم تحليلاً استراتيجياً لمخاطر المخزون ونقاط الاختناق وإجراءات إعادة التوريد المطلوبة بناءً على البيانات المحسوبة.',
            ],
        ];

        $options = [
            'context_type' => 'inventory',
            'inventory_data' => $inventoryData,
            'max_tokens' => 700,
            'temperature' => 0.3,
        ];

        // 3. Dispatch to AI with fallback
        [$aiAnalysis, $providerUsed, $providerStatus] = $this->dispatchWithFallback($systemPrompt, $messages, $options);

        return [
            'status' => 'success',
            'disclaimer' => 'المؤشرات والتقديرات مبنية على معدلات المبيعات التاريخية ولا تمثل تعديلاً تلقائياً للمخزون.',
            'summary' => $inventoryData['summary'],
            'items' => $inventoryData['items'],
            'ai_insights' => $aiAnalysis,
            'provider' => $providerUsed,
            'provider_status' => $providerStatus,
        ];
    }

    /**
     * Build prompt for inventory intelligence.
     */
    protected function buildSystemPrompt(Tenant $tenant, array $inventoryData): string
    {
        $dataJson = json_encode([
            'store_name' => $tenant->name,
            'summary' => $inventoryData['summary'],
            'critical_and_warning_samples' => array_slice($inventoryData['items'], 0, 10),
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        return <<<PROMPT
أنت "مستشار إدارة سلاسل الإمداد والمخزون" في منصة التجارة الإلكترونية NOVA.
تساعد تاجر المتجر في تجنب نفاد البضائع وتخفيض تكلفة الركود بناءً على أرقام المخزون وسرعة البيع الفعلية.

القواعد الإلزامية:
1. التزم بدقة بالأرقام المحسوبة (عدد المنتجات النافدة، والمهددة، ومعدل السحب اليومي).
2. لا تدعِ أن النظام قام بطلب بضائع أو تعديل المستودع تلقائياً؛ القرارات والتعديلات بيد التاجر فقط.
3. قدم أولويات واضحة ومرتبة للمنتجات الحرجة التي قاربت على النفاد، مع توضيح الإجراء المقترح.

بيانات المخزون المحسوبة برمجياً:
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
                Log::warning('OpenAI inventory call failed: ' . $e->getMessage());
            }
        }

        if (in_array($configuredProvider, ['gemini', 'auto'], true) && $this->geminiProvider->isConfigured()) {
            try {
                $result = $this->geminiProvider->chat($systemPrompt, $messages, $options);
                if ($result['status'] === 'success' && !empty($result['content'])) {
                    return [$result['content'], 'gemini', 'live'];
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini inventory call failed: ' . $e->getMessage());
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
