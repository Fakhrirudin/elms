<?php

namespace App\Modules\Assessments\Resources;

use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin QuizAttempt
 */
class QuizSubmitResultResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'attempt_id' => $this->id,
            'score' => $this->score,
            'passing_grade' => $this->quiz?->passing_grade,
            'passed' => $this->passed,
            'submitted_at' => $this->submitted_at?->toISOString(),
        ];
    }
}
