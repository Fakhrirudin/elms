<?php

namespace App\Modules\Users\Resources;

use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Department
 */
class DepartmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'parent_id' => $this->parent_id,
            'parent' => $this->whenLoaded('parent', function () {
                if ($this->parent === null) {
                    return null;
                }

                return [
                    'id' => $this->parent->id,
                    'name' => $this->parent->name,
                ];
            }),
            'users_count' => $this->whenCounted('users'),
            'children_count' => $this->whenCounted('children'),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
