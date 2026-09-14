<?php

namespace App\Modules\Courses\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCourseRequest extends FormRequest
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
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'thumbnail' => ['nullable', 'string', 'max:255'],
            'estimated_duration' => ['sometimes', 'required', 'integer', 'min:1'],
        ];
    }
}
