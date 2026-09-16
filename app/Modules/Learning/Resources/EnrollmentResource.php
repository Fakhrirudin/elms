<?php

namespace App\Modules\Learning\Resources;

use App\Models\Enrollment;
use App\Modules\Courses\Resources\CourseResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Enrollment
 */
class EnrollmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'course_id' => $this->course_id,
            'status' => $this->status,
            'enrolled_at' => $this->enrolled_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'course' => new CourseResource($this->whenLoaded('course')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
