<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Category\StoreCategoryRequest;
use App\Http\Requests\Api\V1\Category\UpdateCategoryRequest;
use App\Http\Resources\Api\V1\CategoryResource;
use App\Models\Category;
use App\Services\Catalog\CategoryService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class CategoryController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected CategoryService $categoryService
    ) {}

    /**
     * Display a listing of categories for current tenant.
     */
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Category::class);

        $categories = $this->categoryService->list();

        return CategoryResource::collection($categories);
    }

    /**
     * Store a newly created category.
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $this->categoryService->create($request->validated());

        return response()->json([
            'message' => 'Category created successfully.',
            'category' => new CategoryResource($category),
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified category.
     */
    public function show(Category $category): JsonResponse
    {
        $this->authorize('view', $category);

        return response()->json([
            'category' => new CategoryResource($category->loadCount('products')),
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified category.
     */
    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $this->authorize('update', $category);

        $updated = $this->categoryService->update($category, $request->validated());

        return response()->json([
            'message' => 'Category updated successfully.',
            'category' => new CategoryResource($updated),
        ], Response::HTTP_OK);
    }

    /**
     * Remove the specified category.
     */
    public function destroy(Category $category): JsonResponse
    {
        $this->authorize('delete', $category);

        $this->categoryService->delete($category);

        return response()->json([
            'message' => 'Category deleted successfully.',
        ], Response::HTTP_OK);
    }
}
