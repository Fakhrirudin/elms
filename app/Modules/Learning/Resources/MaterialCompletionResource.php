<?php

namespace App\Modules\Learning\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialCompletionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'material_id' => $this->resource['material_id'],
            'completed_at' => $this->resource['completed_at'] instanceof \DateTimeInterface
                ? $this->resource['completed_at']->format('c')
                : $this->resource['completed_at'],
            'progress' => $this->resource['progress'],
        ];
    }
}

