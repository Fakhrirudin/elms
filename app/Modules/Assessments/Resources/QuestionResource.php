<?php

namespace App\Modules\Assessments\Resources;

use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Question
 */
class QuestionResource extends JsonResource
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
        $options = $this->whenLoaded('options', function () {
            return $this->options->map(function ($option) {
                return (new OptionResource($option))->withRevealedCorrect($this->revealCorrect);
            });
        });

        return [
            'id' => $this->id,
            'quiz_id' => $this->quiz_id,
            'question' => $this->question,
            'sort_order' => $this->sort_order,
            'options' => $options,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
