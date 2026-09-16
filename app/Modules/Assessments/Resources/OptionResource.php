<?php

namespace App\Modules\Assessments\Resources;

use App\Models\Option;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Option
 */
class OptionResource extends JsonResource
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
        $canSee = $this->revealCorrect || ($user && $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN));

        return [
            'id' => $this->id,
            'question_id' => $this->question_id,
            'option_text' => $this->option_text,
            'is_correct' => $this->when($canSee, $this->is_correct),
            'sort_order' => $this->sort_order,
        ];
    }
}
