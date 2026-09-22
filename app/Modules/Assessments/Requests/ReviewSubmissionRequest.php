<?php

namespace App\Modules\Assessments\Requests;

use App\Models\AssignmentSubmission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var AssignmentSubmission|null $submission */
        $submission = $this->route('submission');
        $maxScore = $submission?->assignment?->max_score ?? 100;

        return [
            'status' => [
                'required',
                'string',
                Rule::in([AssignmentSubmission::STATUS_PASSED, AssignmentSubmission::STATUS_NEEDS_REVISION]),
            ],
            'score' => [
                'required',
                'integer',
                'min:0',
                "max:{$maxScore}",
            ],
            'feedback' => [
                'nullable',
                'string',
                'max:5000',
                Rule::requiredIf(fn () => $this->input('status') === AssignmentSubmission::STATUS_NEEDS_REVISION),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        /** @var AssignmentSubmission|null $submission */
        $submission = $this->route('submission');
        $maxScore = $submission?->assignment?->max_score ?? 100;

        return [
            'score.max' => "The score may not be greater than {$maxScore}.",
            'feedback.required' => 'Feedback is required when requesting revision.',
        ];
    }
}
