<?php

namespace App\Modules\Assessments\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateQuestionRequest extends FormRequest
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
            'question' => ['sometimes', 'required', 'string'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'options' => ['sometimes', 'array', 'min:2'],
            'options.*.id' => ['sometimes', 'integer'],
            'options.*.option_text' => ['required_with:options', 'string'],
            'options.*.is_correct' => ['required_with:options', 'boolean'],
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
