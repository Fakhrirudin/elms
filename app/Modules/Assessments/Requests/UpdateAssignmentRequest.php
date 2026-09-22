<?php

namespace App\Modules\Assessments\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssignmentRequest extends FormRequest
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
        return [
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'instructions' => ['sometimes', 'required', 'string'],
            'due_at' => ['nullable', 'date'],
            'max_score' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'max_attempts' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'is_required' => ['sometimes', 'boolean'],
        ];
    }
}
