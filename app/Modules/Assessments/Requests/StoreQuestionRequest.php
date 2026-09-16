<?php

namespace App\Modules\Assessments\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreQuestionRequest extends FormRequest
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
            'question' => ['required', 'string'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'options' => ['required', 'array', 'min:2'],
            'options.*.option_text' => ['required', 'string'],
            'options.*.is_correct' => ['required', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $options = $this->input('options');
            if (is_array($options)) {
                $correctCount = collect($options)->where('is_correct', true)->count();
                if ($correctCount !== 1) {
                    $validator->errors()->add('options', 'Question must have exactly one correct option.');
                }
            }
        });
    }
}

