<?php

namespace App\Modules\Assessments\Resources;

use App\Models\AssignmentSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AssignmentSubmission
 */
class AssignmentSubmissionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'assignment_id' => $this->assignment_id,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'department' => $this->user->department?->name,
                ];
            }),
            'attempt_number' => $this->attempt_number,
            'original_filename' => $this->original_filename,
            'mime_type' => $this->mime_type,
            'file_size' => $this->file_size,
            'comment' => $this->comment,
            'status' => $this->status,
            'submitted_at' => $this->submitted_at?->toISOString(),
            'score' => $this->score,
            'feedback' => $this->feedback,
            'reviewed_by' => $this->reviewed_by,
            'reviewer' => $this->whenLoaded('reviewer', function () {
                return [
                    'id' => $this->reviewer->id,
                    'name' => $this->reviewer->name,
                ];
            }),
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'download_url' => url("/api/v1/assignment-submissions/{$this->id}/download"),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
