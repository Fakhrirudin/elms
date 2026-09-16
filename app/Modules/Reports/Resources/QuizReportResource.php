<?php

namespace App\Modules\Reports\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizReportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'quiz_id' => $this->resource['quiz_id'],
            'quiz_title' => $this->resource['quiz_title'],
            'course' => [
                'id' => $this->resource['course_id'],
                'title' => $this->resource['course_title'],
            ],
            'passing_grade' => (float) $this->resource['passing_grade'],
            'total_attempts' => (int) $this->resource['total_attempts'],
            'total_passed' => (int) $this->resource['total_passed'],
            'total_failed' => (int) $this->resource['total_failed'],
            'pass_rate' => (float) $this->resource['pass_rate'],
            'average_score' => (float) $this->resource['average_score'],
            'min_score' => (float) $this->resource['min_score'],
            'max_score' => (float) $this->resource['max_score'],
        ];
    }
}
