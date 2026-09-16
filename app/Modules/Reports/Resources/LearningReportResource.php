<?php

namespace App\Modules\Reports\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LearningReportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'enrollment_id' => $this->resource['enrollment_id'],
            'employee' => [
                'id' => $this->resource['user_id'],
                'name' => $this->resource['employee_name'],
                'nip' => $this->resource['nip'],
                'department' => $this->resource['department'],
            ],
            'course' => [
                'id' => $this->resource['course_id'],
                'title' => $this->resource['course_title'],
            ],
            'status' => $this->resource['status'],
            'progress' => (int) $this->resource['progress'],
            'enrolled_at' => $this->resource['enrolled_at'],
            'completed_at' => $this->resource['completed_at'],
        ];
    }
}

