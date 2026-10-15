<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Product\IndexProductRequest;
use App\Http\Requests\Api\V1\Product\StoreProductRequest;
use App\Http\Requests\Api\V1\Product\UpdateProductRequest;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Product;
use App\Services\Catalog\ProductService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ProductController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected ProductService $productService
    ) {}

    /**
     * Display a listing of products with search, filter, and pagination.
     */
    public function index(IndexProductRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Product::class);

        $products = $this->productService->list($request->validated());

        return ProductResource::collection($products);
    }

    /**
     * Store a newly created product.
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->productService->create($request->validated());

        return response()->json([
            'message' => 'Product created successfully.',
            'product' => new ProductResource($product),
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        return response()->json([
            'product' => new ProductResource($product->load(['category', 'images', 'variants'])),
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified product.
     */
    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $updated = $this->productService->update($product, $request->validated());

        return response()->json([
            'message' => 'Product updated successfully.',
            'product' => new ProductResource($updated),
        ], Response::HTTP_OK);
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Product $product): JsonResponse
    {
        $this->authorize('delete', $product);

        $this->productService->delete($product);

        return response()->json([
            'message' => 'Product deleted successfully.',
        ], Response::HTTP_OK);
    }
}
