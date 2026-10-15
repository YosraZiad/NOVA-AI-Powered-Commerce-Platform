<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Product\StoreProductVariantRequest;
use App\Http\Requests\Api\V1\Product\UpdateProductVariantRequest;
use App\Http\Resources\Api\V1\ProductVariantResource;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\Catalog\ProductVariantService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ProductVariantController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected ProductVariantService $productVariantService
    ) {}

    /**
     * Display a listing of variants for a product.
     */
    public function index(Product $product): AnonymousResourceCollection
    {
        $this->authorize('view', $product);

        $variants = $this->productVariantService->list($product);

        return ProductVariantResource::collection($variants);
    }

    /**
     * Store a newly created variant for a product.
     */
    public function store(StoreProductVariantRequest $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $variant = $this->productVariantService->create($product, $request->validated());

        return response()->json([
            'message' => 'Product variant created successfully.',
            'variant' => new ProductVariantResource($variant),
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified variant.
     */
    public function show(Product $product, ProductVariant $variant): JsonResponse
    {
        $this->authorize('view', $product);

        if ((int) $variant->product_id !== (int) $product->id) {
            throw new NotFoundHttpException('Variant does not belong to this product.');
        }

        return response()->json([
            'variant' => new ProductVariantResource($variant),
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified variant.
     */
    public function update(
        UpdateProductVariantRequest $request,
        Product $product,
        ProductVariant $variant
    ): JsonResponse {
        $this->authorize('update', $product);

        if ((int) $variant->product_id !== (int) $product->id) {
            throw new NotFoundHttpException('Variant does not belong to this product.');
        }

        $updated = $this->productVariantService->update($product, $variant, $request->validated());

        return response()->json([
            'message' => 'Product variant updated successfully.',
            'variant' => new ProductVariantResource($updated),
        ], Response::HTTP_OK);
    }

    /**
     * Remove the specified variant.
     */
    public function destroy(Product $product, ProductVariant $variant): JsonResponse
    {
        $this->authorize('update', $product);

        if ((int) $variant->product_id !== (int) $product->id) {
            throw new NotFoundHttpException('Variant does not belong to this product.');
        }

        $this->productVariantService->delete($product, $variant);

        return response()->json([
            'message' => 'Product variant deleted successfully.',
        ], Response::HTTP_OK);
    }
}
