<?php

namespace App\Modules\Assessments\Resources;

use App\Models\Quiz;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Quiz
 */
class QuizResource extends JsonResource
{
    protected bool $revealCorrect = false;

    public function withRevealedCorrect(bool $reveal = true): static
    {
        $this->revealCorrect = $reveal;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $canSeeCorrect = $this->revealCorrect || ($user && $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN));

        return [
            'id' => $this->id,
            'module_id' => $this->module_id,
            'title' => $this->title,
            'description' => $this->description,
            'passing_grade' => $this->passing_grade,
            'max_attempts' => $this->max_attempts,
            'time_limit_minutes' => $this->time_limit_minutes,
            'status' => $this->status,
            'questions_count' => $this->whenCounted('questions'),
            'questions' => $this->whenLoaded('questions', function () use ($canSeeCorrect) {
                return $this->questions->map(function ($question) use ($canSeeCorrect) {
                    return (new QuestionResource($question))->withRevealedCorrect($canSeeCorrect);
                });
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
