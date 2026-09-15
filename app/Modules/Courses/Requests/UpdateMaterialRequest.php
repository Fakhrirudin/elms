<?php

namespace App\Modules\Courses\Requests;

use App\Models\Material;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaterialRequest extends FormRequest
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
            'type' => ['sometimes', 'required', 'string', Rule::in([
                Material::TYPE_TEXT,
                Material::TYPE_PDF,
                Material::TYPE_VIDEO,
            ])],
            'content' => ['nullable', 'string'],
            'file' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'video_url' => ['nullable', 'url', 'max:500'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_mandatory' => ['sometimes', 'boolean'],
        ];
    }
}
