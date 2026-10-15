<?php

namespace App\Models\Scopes;

use App\Contracts\TenantContextInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    /**
     * Apply the tenant scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (app()->bound(TenantContextInterface::class)) {
            $context = app(TenantContextInterface::class);

            if ($context->hasTenant()) {
                $builder->where($model->qualifyColumn('tenant_id'), $context->id());
            }
        }
    }
}
