<?php

namespace App\Modules\Courses\Requests;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexCourseRequest extends FormRequest
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
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'status' => ['sometimes', 'nullable', 'string', Rule::in([
                Course::STATUS_DRAFT,
                Course::STATUS_PUBLISHED,
                Course::STATUS_ARCHIVED,
            ])],
            'instructor_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'sort_by' => ['sometimes', 'string', Rule::in(['created_at', 'title', 'published_at'])],
            'sort_direction' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
        ];
    }
}
