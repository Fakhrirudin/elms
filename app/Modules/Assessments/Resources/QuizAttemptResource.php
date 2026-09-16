<?php

namespace App\Modules\Assessments\Resources;

use App\Models\QuizAttempt;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin QuizAttempt
 */
class QuizAttemptResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $isAdminOrInstructor = $user && (
            $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN) ||
            ($user->hasRole(Role::INSTRUCTOR) && $this->quiz?->module?->course?->instructor_id === $user->id)
        );

        $revealCorrect = $isAdminOrInstructor || ($this->submitted_at !== null);

        $questions = null;
        if ($this->relationLoaded('quiz') && $this->quiz->relationLoaded('questions')) {
            $questions = $this->quiz->questions->map(function ($question) use ($revealCorrect) {
                return (new QuestionResource($question))->withRevealedCorrect($revealCorrect);
            });
        } elseif ($this->relationLoaded('questions')) {
            $questions = $this->questions->map(function ($question) use ($revealCorrect) {
                return (new QuestionResource($question))->withRevealedCorrect($revealCorrect);
            });
        }

        return [
            'id' => $this->id,
            'quiz_id' => $this->quiz_id,
            'user_id' => $this->user_id,
            'attempt_number' => $this->attempt_number,
            'score' => $this->score,
            'passed' => $this->passed,
            'started_at' => $this->started_at?->toISOString(),
            'submitted_at' => $this->submitted_at?->toISOString(),
            'questions' => $this->when($questions !== null, $questions),
            'answers' => $this->whenLoaded('answers'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
