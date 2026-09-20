<?php

namespace App\Modules\Courses\Resources;

use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Course
 */
class CourseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'thumbnail' => $this->thumbnail,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ]),
            'estimated_duration' => $this->estimated_duration,
            'status' => $this->status,
            'published_at' => $this->published_at?->toISOString(),
            'instructors' => CourseInstructorResource::collection($this->whenLoaded('instructors')),
            'modules_count' => $this->when(isset($this->modules_count), (int) $this->modules_count),
            'materials_count' => $this->when(isset($this->materials_count), (int) $this->materials_count),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
