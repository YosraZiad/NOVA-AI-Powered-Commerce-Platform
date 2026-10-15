<?php

namespace App\Contracts;

use App\Models\Tenant;

interface TenantContextInterface
{
    /**
     * Set the current tenant for the request lifecycle.
     */
    public function setTenant(?Tenant $tenant): void;

    /**
     * Get the current resolved tenant.
     */
    public function getTenant(): ?Tenant;

    /**
     * Check if a tenant has been resolved for the current request.
     */
    public function hasTenant(): bool;

    /**
     * Get the ID of the current tenant, if resolved.
     */
    public function id(): ?int;
}
