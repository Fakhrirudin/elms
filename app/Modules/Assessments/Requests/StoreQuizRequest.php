<?php

namespace App\Modules\Assessments\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuizRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'passing_grade' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'max_attempts' => ['sometimes', 'integer', 'min:1'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1'],
        ];
    }
}

