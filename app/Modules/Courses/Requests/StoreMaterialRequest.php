<?php

namespace App\Modules\Courses\Requests;

use App\Models\Material;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMaterialRequest extends FormRequest
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
            'type' => ['required', 'string', Rule::in([
                Material::TYPE_TEXT,
                Material::TYPE_PDF,
                Material::TYPE_VIDEO,
            ])],
            'content' => ['required_if:type,'.Material::TYPE_TEXT, 'nullable', 'string'],
            'file' => ['required_if:type,'.Material::TYPE_PDF, 'file', 'mimes:pdf', 'max:20480'],
            'video_url' => ['required_if:type,'.Material::TYPE_VIDEO, 'nullable', 'url', 'max:500'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_mandatory' => ['sometimes', 'boolean'],
        ];
    }
}
