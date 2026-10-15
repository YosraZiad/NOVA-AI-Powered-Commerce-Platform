<?php

namespace App\Http\Resources\Api\V1;

use App\Contracts\TenantContextInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $tenantContext = app(TenantContextInterface::class);
        $currentTenant = $tenantContext->getTenant();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'status' => $this->status,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'roles' => $this->getRoleNames(),
            'current_tenant' => $currentTenant ? new TenantResource($currentTenant) : null,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
