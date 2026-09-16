<?php

namespace App\Modules\Reports\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseReportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'course_id' => $this->resource['course_id'],
            'title' => $this->resource['title'],
            'slug' => $this->resource['slug'],
            'status' => $this->resource['status'],
            'category' => $this->resource['category'],
            'total_enrollments' => (int) $this->resource['total_enrollments'],
            'in_progress_count' => (int) $this->resource['in_progress_count'],
            'completed_count' => (int) $this->resource['completed_count'],
            'completion_rate' => (float) $this->resource['completion_rate'],
        ];
    }
}

