<?php

namespace App\Modules\Courses\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderMaterialsRequest extends FormRequest
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
            'materials' => ['required', 'array', 'min:1'],
            'materials.*.id' => ['required', 'integer', 'exists:materials,id'],
            'materials.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
