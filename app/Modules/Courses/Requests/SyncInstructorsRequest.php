<?php

namespace App\Modules\Courses\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncInstructorsRequest extends FormRequest
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
            'instructor_ids' => ['required_without:user_ids', 'array'],
            'instructor_ids.*' => ['integer', 'exists:users,id'],
            'user_ids' => ['required_without:instructor_ids', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ];
    }

    /**
     * Get the resolved instructor IDs from either input key.
     *
     * @return array<int>
     */
    public function instructorIds(): array
    {
        /** @var array<int> $ids */
        $ids = $this->input('instructor_ids', $this->input('user_ids', []));

        return array_map('intval', $ids);
    }
}
