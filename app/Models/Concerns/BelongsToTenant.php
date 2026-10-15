<?php

namespace App\Models\Concerns;

use App\Contracts\TenantContextInterface;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    /**
     * Boot the BelongsToTenant trait for the model.
     */
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope());

        static::creating(function ($model) {
            if (empty($model->tenant_id) && app()->bound(TenantContextInterface::class)) {
                $context = app(TenantContextInterface::class);
                if ($context->hasTenant()) {
                    // Always enforce tenant ownership from trusted context
                    $model->tenant_id = $context->id();
                }
            }
        });

        static::updating(function ($model) {
            // Prevent tampering with tenant_id once assigned
            if ($model->isDirty('tenant_id') && $model->getOriginal('tenant_id') !== null) {
                $model->tenant_id = $model->getOriginal('tenant_id');
            }
        });
    }

    /**
     * Get the tenant that owns this record.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
