<?php

namespace App\Modules\Learning\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LearningProgressResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'enrollment_id' => $this->resource['enrollment_id'],
            'course_id' => $this->resource['course_id'],
            'status' => $this->resource['status'],
            'progress' => $this->resource['progress'],
            'total_mandatory_materials' => $this->resource['total_mandatory_materials'],
            'completed_mandatory_materials' => $this->resource['completed_mandatory_materials'],
        ];
    }
}
