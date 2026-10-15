<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Product\StoreProductImageRequest;
use App\Http\Resources\Api\V1\ProductImageResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\Catalog\ProductImageService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ProductImageController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected ProductImageService $productImageService
    ) {}

    /**
     * Display a listing of images for a product.
     */
    public function index(Product $product): AnonymousResourceCollection
    {
        $this->authorize('view', $product);

        $images = $this->productImageService->list($product);

        return ProductImageResource::collection($images);
    }

    /**
     * Store a newly created image for a product.
     */
    public function store(StoreProductImageRequest $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $image = $this->productImageService->upload(
            product: $product,
            file: $request->file('image'),
            altText: $request->validated('alt_text'),
            sortOrder: $request->validated('sort_order')
        );

        return response()->json([
            'message' => 'Product image uploaded successfully.',
            'image' => new ProductImageResource($image),
        ], Response::HTTP_CREATED);
    }

    /**
     * Remove the specified image from a product.
     */
    public function destroy(Product $product, ProductImage $image): JsonResponse
    {
        $this->authorize('update', $product);

        $this->productImageService->delete($product, $image);

        return response()->json([
            'message' => 'Product image deleted successfully.',
        ], Response::HTTP_OK);
    }
}
