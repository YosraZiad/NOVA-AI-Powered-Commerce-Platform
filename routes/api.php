<?php

use App\Http\Controllers\Api\V1\AccountOrderController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PlatformController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProductImageController;
use App\Http\Controllers\Api\V1\ProductVariantController;
use App\Http\Controllers\Api\V1\StorefrontController;
use App\Http\Controllers\Api\V1\TenantController;
use App\Http\Controllers\Api\V1\MerchantDashboardController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\MerchantCustomerController;
use App\Http\Controllers\Api\V1\MerchantSettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Version 1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // 1. Authentication Routes
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });
    });

    // 2. Platform Admin Routes (Restricted strictly to Platform Admin role)
    Route::prefix('platform')->middleware(['auth:sanctum'])->group(function () {
        Route::get('metrics', [PlatformController::class, 'metrics']);
        Route::get('tenants', [PlatformController::class, 'tenants']);
        Route::post('tenants', [PlatformController::class, 'storeTenant']);
        Route::patch('tenants/{tenant}/status', [PlatformController::class, 'updateTenantStatus']);
        Route::get('users', [PlatformController::class, 'users']);
    });

    // 3. Public Storefront Routes (Tenant-scoped by store slug)
    Route::prefix('storefront/{tenant_slug}')->group(function () {
        Route::get('/', [StorefrontController::class, 'info']);
        Route::get('products', [StorefrontController::class, 'products']);
        Route::get('categories', [StorefrontController::class, 'categories']);
        Route::post('checkout', [StorefrontController::class, 'checkout']);
        Route::get('orders/{order_number}', [StorefrontController::class, 'order']);
    });

    // 4. Authenticated Customer Account Routes
    Route::prefix('account')->middleware(['auth:sanctum'])->group(function () {
        Route::get('orders', [AccountOrderController::class, 'index']);
        Route::get('orders/{order}', [AccountOrderController::class, 'show']);
    });

    // 5. Merchant & Staff Tenant-Scoped Routes (Protected by Sanctum and Tenant Context Resolution)
    Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
        Route::get('tenant/current', [TenantController::class, 'current']);

        // Categories
        Route::apiResource('categories', CategoryController::class);

        // Products
        Route::apiResource('products', ProductController::class);

        // Product Images
        Route::prefix('products/{product}/images')->group(function () {
            Route::get('/', [ProductImageController::class, 'index']);
            Route::post('/', [ProductImageController::class, 'store']);
            Route::delete('/{image}', [ProductImageController::class, 'destroy']);
        });

        // Product Variants
        Route::prefix('products/{product}/variants')->group(function () {
            Route::get('/', [ProductVariantController::class, 'index']);
            Route::post('/', [ProductVariantController::class, 'store']);
            Route::get('/{variant}', [ProductVariantController::class, 'show']);
            Route::match(['put', 'patch'], '/{variant}', [ProductVariantController::class, 'update']);
            Route::delete('/{variant}', [ProductVariantController::class, 'destroy']);
        });

        // Orders Management
        Route::apiResource('orders', OrderController::class)->only(['index', 'show']);
        Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus']);
        Route::patch('orders/{order}/payment-status', [OrderController::class, 'updatePaymentStatus']);

        // Merchant Dashboard Overview Metrics
        Route::get('merchant/metrics', [MerchantDashboardController::class, 'metrics']);

        // Inventory Management
        Route::get('inventory', [InventoryController::class, 'index']);
        Route::post('inventory/{product}/adjust', [InventoryController::class, 'adjust']);

        // Scoped Customer Directory
        Route::get('customers', [MerchantCustomerController::class, 'index']);

        // Store Settings
        Route::get('merchant/settings', [MerchantSettingsController::class, 'show']);
        Route::patch('merchant/settings', [MerchantSettingsController::class, 'update']);
    });
});
