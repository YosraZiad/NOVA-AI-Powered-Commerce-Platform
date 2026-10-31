<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\StorefrontAiChatRequest;
use App\Http\Requests\Api\V1\Storefront\StorefrontRecommendationsRequest;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\AiConversation;
use App\Models\Product;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Services\AI\CustomerShoppingAssistantService;
use App\Services\AI\ProductRecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StorefrontAiController extends Controller
{
    /**
     * Resolve active tenant by slug or fallback in standalone mode.
     */
    protected function getActiveTenant(string $slug): Tenant
    {
        $tenant = Tenant::where('slug', $slug)
            ->where('status', 'active')
            ->first();

        if (!$tenant && config('nova.deployment_mode') === 'standalone') {
            $tenant = Tenant::where('status', 'active')->first();
        }

        if (!$tenant) {
            abort(Response::HTTP_NOT_FOUND, 'Storefront not found or currently unavailable.');
        }

        return $tenant;
    }

    /**
     * Process a shopper's query via the AI shopping assistant.
     */
    public function chat(
        StorefrontAiChatRequest $request,
        string $tenant_slug,
        CustomerShoppingAssistantService $assistantService
    ): JsonResponse {
        $tenant = $this->getActiveTenant($tenant_slug);

        $validated = $request->validated();
        $message = $validated['message'];
        $conversationUuid = $validated['conversation_uuid'] ?? null;
        $context = $validated['context'] ?? [];
        $sessionId = $validated['session_id'] ?? $request->header('X-Session-ID');
        $userId = $request->user('sanctum')?->id;

        $response = $assistantService->handleCustomerMessage(
            tenant: $tenant,
            message: $message,
            conversationUuid: $conversationUuid,
            context: $context,
            userId: $userId,
            sessionId: $sessionId
        );

        return response()->json($response);
    }

    /**
     * Get automated context-aware product recommendations.
     */
    public function recommendations(
        StorefrontRecommendationsRequest $request,
        string $tenant_slug,
        ProductRecommendationService $recommendationService
    ): JsonResponse {
        $tenant = $this->getActiveTenant($tenant_slug);

        $result = $recommendationService->getRecommendations($tenant, $request->validated());

        return response()->json([
            'status' => 'success',
            'headline' => $result['headline'],
            'intent' => $result['intent'],
            'items' => $result['items'],
        ]);
    }

    /**
     * Retrieve conversation history for a given UUID with privacy checks.
     */
    public function conversation(Request $request, string $tenant_slug, string $uuid): JsonResponse
    {
        $tenant = $this->getActiveTenant($tenant_slug);

        /** @var AiConversation|null $conversation */
        $conversation = AiConversation::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->where('uuid', $uuid)
            ->with(['messages' => function ($q) {
                $q->orderBy('created_at', 'asc')->orderBy('id', 'asc');
            }])
            ->first();

        if (!$conversation) {
            return response()->json([
                'message' => 'المحادثة غير موجودة أو انتهت صلاحيتها.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Privacy checks:
        $currentUserId = $request->user('sanctum')?->id;
        $sessionId = $request->input('session_id') ?? $request->header('X-Session-ID');

        // 1. If conversation belongs to an authenticated user, require same user
        if ($conversation->user_id && $conversation->user_id !== $currentUserId) {
            return response()->json([
                'message' => 'غير مصرح لك بعرض هذه المحادثة.',
            ], Response::HTTP_FORBIDDEN);
        }

        // 2. If conversation belongs to a guest session, require matching session_id
        if (!$conversation->user_id && $conversation->session_id) {
            if (!$sessionId || $conversation->session_id !== $sessionId) {
                return response()->json([
                    'message' => 'غير مصرح لك بعرض هذه المحادثة.',
                ], Response::HTTP_FORBIDDEN);
            }
        }

        // Collect all recommended product IDs across messages to hydrate ProductResources
        $allProductIds = collect();
        foreach ($conversation->messages as $msg) {
            if (!empty($msg->product_ids) && is_array($msg->product_ids)) {
                $allProductIds = $allProductIds->concat($msg->product_ids);
            }
        }

        $allProductIds = $allProductIds->unique()->values();
        $hydratedProducts = collect();

        if ($allProductIds->isNotEmpty()) {
            $products = Product::withoutGlobalScope(TenantScope::class)
                ->where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->whereIn('id', $allProductIds)
                ->with(['category', 'images', 'variants'])
                ->get();

            $hydratedProducts = $products->keyBy('id')->map(function ($p) {
                return (new ProductResource($p))->resolve();
            });
        }

        $messages = $conversation->messages->map(function ($msg) use ($hydratedProducts) {
            $recProducts = [];
            if (!empty($msg->product_ids) && is_array($msg->product_ids)) {
                foreach ($msg->product_ids as $pid) {
                    if (isset($hydratedProducts[$pid])) {
                        $recProducts[] = $hydratedProducts[$pid];
                    }
                }
            }

            return [
                'id' => $msg->id,
                'role' => $msg->role,
                'content' => $msg->content,
                'recommended_products' => $recProducts,
                'created_at' => $msg->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'conversation_uuid' => $conversation->uuid,
            'title' => $conversation->title,
            'messages' => $messages,
        ]);
    }
}
