<?php

namespace App\Modules\Reports\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QuizReportRequest extends FormRequest
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
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'quiz_id' => ['sometimes', 'integer', 'exists:quizzes,id'],
            'course_id' => ['sometimes', 'integer', 'exists:courses,id'],
        ];
    }
}
