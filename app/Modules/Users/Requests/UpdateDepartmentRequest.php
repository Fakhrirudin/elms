<?php

namespace App\Modules\Users\Requests;

use App\Models\Department;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var Department|null $department */
        $department = $this->route('department');
        $departmentId = $department instanceof Department ? $department->id : $department;

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('departments', 'name')->ignore($departmentId),
            ],
            'parent_id' => [
                'nullable',
                'integer',
                'exists:departments,id',
                Rule::notIn([$departmentId]),
            ],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }
}
