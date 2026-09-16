<?php

namespace App\Modules\Assessments\Requests;

use App\Models\Quiz;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateQuizStatusRequest extends FormRequest
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
            'status' => ['required', 'string', Rule::in([
                Quiz::STATUS_DRAFT,
                Quiz::STATUS_PUBLISHED,
                Quiz::STATUS_ARCHIVED,
            ])],
        ];
    }
}

