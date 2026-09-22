<?php

namespace App\Modules\Assessments\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubmissionRequest extends FormRequest
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
            'file' => [
                'required',
                'file',
                'max:10240', // 10 MB in kilobytes
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,jpeg,png,webp',
            ],
            'comment' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
