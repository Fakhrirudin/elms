<?php

namespace App\Modules\Courses\Requests;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseStatusRequest extends FormRequest
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
                Course::STATUS_DRAFT,
                Course::STATUS_PUBLISHED,
                Course::STATUS_ARCHIVED,
            ])],
        ];
    }
}
