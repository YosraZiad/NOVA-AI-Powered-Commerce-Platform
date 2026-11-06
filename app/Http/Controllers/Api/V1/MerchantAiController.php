<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\TenantContextInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Merchant\MerchantAiChatRequest;
use App\Http\Requests\Api\V1\Merchant\MerchantMarketingRequest;
use App\Http\Requests\Api\V1\Merchant\MerchantProductContentRequest;
use App\Services\AI\Merchant\MerchantAnalyticsAggregator;
use App\Services\AI\Merchant\MerchantBusinessAssistantService;
use App\Services\AI\Merchant\MerchantCustomerInsightsService;
use App\Services\AI\Merchant\MerchantInventoryIntelligenceService;
use App\Services\AI\Merchant\MerchantMarketingService;
use App\Services\AI\Merchant\MerchantProductContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MerchantAiController extends Controller
{
    public function __construct(
        protected TenantContextInterface $tenantContext,
        protected MerchantBusinessAssistantService $businessAssistant,
        protected MerchantProductContentService $productContentService,
        protected MerchantMarketingService $marketingService,
        protected MerchantInventoryIntelligenceService $inventoryService,
        protected MerchantCustomerInsightsService $customerService,
        protected MerchantAnalyticsAggregator $aggregator
    ) {}

    /**
     * Resolve active tenant from context or fail.
     */
    protected function getActiveTenant()
    {
        $tenant = $this->tenantContext->getTenant();
        if (!$tenant) {
            abort(Response::HTTP_NOT_FOUND, 'No active tenant in context.');
        }
        return $tenant;
    }

    /**
     * Verify user has merchant/staff authorization.
     */
    protected function authorizeMerchant(Request $request, ?string $permission = null): void
    {
        $user = $request->user();

        if (!$user) {
            abort(Response::HTTP_UNAUTHORIZED, 'Unauthenticated.');
        }

        $hasRole = $user->hasAnyRole(['Merchant', 'Staff', 'Platform Admin']);
        $hasPermission = $permission ? $user->can($permission) : false;

        if (!$hasRole && !$hasPermission) {
            abort(Response::HTTP_FORBIDDEN, 'Unauthorized. Merchant permission required.');
        }
    }

    /**
     * Executive AI briefing & high-level business overview.
     */
    public function overview(Request $request): JsonResponse
    {
        $this->authorizeMerchant($request, 'analytics.view');
        $tenant = $this->getActiveTenant();

        $metrics = $this->aggregator->getPerformanceMetrics($tenant, '30d');
        $inventory = $this->aggregator->getInventoryIntelligence($tenant);

        // Generate concise briefing
        $urgentAlerts = [];
        if ($inventory['summary']['out_of_stock_count'] > 0) {
            $urgentAlerts[] = [
                'type' => 'out_of_stock',
                'severity' => 'critical',
                'title' => 'منتجات نفدت من المخزون',
                'description' => "يوجد {$inventory['summary']['out_of_stock_count']} منتج نفد تماماً ويتطلب إعادة التوريد فورياً.",
            ];
        }

        if ($inventory['summary']['critical_risk_count'] > 0) {
            $urgentAlerts[] = [
                'type' => 'critical_stockout',
                'severity' => 'warning',
                'title' => 'مخاطر نفاد وشيك (خلال 7 أيام)',
                'description' => "يوجد {$inventory['summary']['critical_risk_count']} منتج مهدد بالنفاد خلال أسبوع بناءً على وتيرة المبيعات.",
            ];
        }

        $briefingText = sprintf(
            'خلال آخر 30 يوماً، حقق المتجر إيرادات مؤكدة قدرها %.2f %s عبر %d طلب (متوسط الطلب %.2f %s).',
            $metrics['current']['revenue'],
            $tenant->currency ?: 'SAR',
            $metrics['current']['orders_count'],
            $metrics['current']['average_order_value'],
            $tenant->currency ?: 'SAR'
        );

        return response()->json([
            'status' => 'success',
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'currency' => $tenant->currency ?: 'SAR',
            ],
            'executive_briefing' => $briefingText,
            'kpis' => [
                'revenue_30d' => $metrics['current']['revenue'],
                'orders_30d' => $metrics['current']['orders_count'],
                'aov_30d' => $metrics['current']['average_order_value'],
                'growth' => $metrics['comparison']['revenue_growth_percentage'] ?? null,
            ],
            'urgent_alerts' => $urgentAlerts,
            'top_sellers' => array_slice($metrics['top_sellers'], 0, 3),
            'inventory_summary' => $inventory['summary'],
        ]);
    }

    /**
     * Interactive Business Intelligence assistant.
     */
    public function chat(MerchantAiChatRequest $request): JsonResponse
    {
        $this->authorizeMerchant($request, 'analytics.view');
        $tenant = $this->getActiveTenant();

        $validated = $request->validated();
        $period = $validated['period'] ?? '30d';

        $result = $this->businessAssistant->askBusinessAssistant(
            tenant: $tenant,
            message: $validated['message'],
            period: $period
        );

        return response()->json($result);
    }

    /**
     * Product Content & SEO generation and enhancement studio.
     */
    public function productContent(MerchantProductContentRequest $request): JsonResponse
    {
        $this->authorizeMerchant($request, 'products.update');
        $tenant = $this->getActiveTenant();

        $result = $this->productContentService->generateContent($tenant, $request->validated());

        return response()->json($result);
    }

    /**
     * Marketing campaigns and social media drafts studio.
     */
    public function marketing(MerchantMarketingRequest $request): JsonResponse
    {
        $this->authorizeMerchant($request, 'analytics.view');
        $tenant = $this->getActiveTenant();

        $result = $this->marketingService->generateCampaigns($tenant, $request->validated());

        return response()->json($result);
    }

    /**
     * Inventory velocity, burn rate, and stockout risk insights.
     */
    public function inventoryInsights(Request $request): JsonResponse
    {
        $this->authorizeMerchant($request, 'inventory.view');
        $tenant = $this->getActiveTenant();

        $result = $this->inventoryService->getInventoryInsights($tenant);

        return response()->json($result);
    }

    /**
     * Anonymized, aggregated customer purchasing behavior insights.
     */
    public function customerInsights(Request $request): JsonResponse
    {
        $this->authorizeMerchant($request, 'orders.view');
        $tenant = $this->getActiveTenant();

        $result = $this->customerService->getCustomerInsights($tenant);

        return response()->json($result);
    }
}
