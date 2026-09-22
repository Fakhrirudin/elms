<?php

namespace App\Modules\Assessments\Resources;

use App\Models\Assignment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Assignment
 */
class AssignmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'module_id' => $this->module_id,
            'course_id' => $this->module?->course_id,
            'title' => $this->title,
            'instructions' => $this->instructions,
            'due_at' => $this->due_at?->toISOString(),
            'max_score' => $this->max_score,
            'max_attempts' => $this->max_attempts,
            'is_required' => $this->is_required,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'published_at' => $this->published_at?->toISOString(),
            'closed_at' => $this->closed_at?->toISOString(),
            'submissions_count' => $this->whenCounted('submissions', $this->submissions_count),
            'latest_submission' => $this->whenLoaded('submissions', function () use ($request) {
                $user = $request->user();
                if (! $user) {
                    return null;
                }
                $userSubmission = $this->submissions
                    ->where('user_id', $user->id)
                    ->sortByDesc('attempt_number')
                    ->first();

                return $userSubmission ? new AssignmentSubmissionResource($userSubmission) : null;
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
