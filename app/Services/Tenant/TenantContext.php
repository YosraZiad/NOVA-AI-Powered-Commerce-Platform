<?php

namespace App\Services\Tenant;

use App\Contracts\TenantContextInterface;
use App\Models\Tenant;

class TenantContext implements TenantContextInterface
{
    protected ?Tenant $tenant = null;

    /**
     * Set the current tenant for the request lifecycle.
     */
    public function setTenant(?Tenant $tenant): void
    {
        $this->tenant = $tenant;
    }

    /**
     * Get the current resolved tenant.
     */
    public function getTenant(): ?Tenant
    {
        return $this->tenant;
    }

    /**
     * Check if a tenant has been resolved for the current request.
     */
    public function hasTenant(): bool
    {
        return $this->tenant !== null;
    }

    /**
     * Get the ID of the current tenant, if resolved.
     */
    public function id(): ?int
    {
        return $this->tenant?->id;
    }
}
