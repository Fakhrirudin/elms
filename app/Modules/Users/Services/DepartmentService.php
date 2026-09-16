<?php

namespace App\Modules\Users\Services;

use App\Models\Department;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class DepartmentService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<Department>
     */
    public function listDepartments(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        return Department::query()
            ->with(['parent'])
            ->withCount(['users', 'children'])
            ->when(! empty($filters['search']), function ($query) use ($filters) {
                $search = (string) $filters['search'];
                $query->where('name', 'like', "%{$search}%");
            })
            ->when(isset($filters['parent_id']), function ($query) use ($filters) {
                if ($filters['parent_id'] === null || $filters['parent_id'] === 'null') {
                    $query->whereNull('parent_id');
                } else {
                    $query->where('parent_id', (int) $filters['parent_id']);
                }
            })
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function getDepartment(Department $department): Department
    {
        return $department->load(['parent', 'children'])
            ->loadCount(['users', 'children']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createDepartment(array $data): Department
    {
        return Department::create($data)->load(['parent'])->loadCount(['users', 'children']);
    }

    /**
     * @param  array<string, mixed>  $data
     *
     * @throws ValidationException
     */
    public function updateDepartment(Department $department, array $data): Department
    {
        if (isset($data['parent_id']) && $data['parent_id'] !== null) {
            $parentId = (int) $data['parent_id'];
            if ($parentId === $department->id || $this->isDescendant($department->id, $parentId)) {
                throw ValidationException::withMessages([
                    'parent_id' => ['A department cannot have itself or one of its descendants as a parent.'],
                ]);
            }
        }

        $department->update($data);

        return $department->load(['parent'])->loadCount(['users', 'children']);
    }

    /**
     * @throws ValidationException
     */
    public function deleteDepartment(Department $department): void
    {
        if ($department->users()->exists()) {
            throw ValidationException::withMessages([
                'department' => ['Cannot delete a department with assigned users.'],
            ]);
        }

        if ($department->children()->exists()) {
            throw ValidationException::withMessages([
                'department' => ['Cannot delete a department with sub-departments.'],
            ]);
        }

        $department->delete();
    }

    /**
     * Check if $targetId is a descendant of $ancestorId.
     */
    protected function isDescendant(int $ancestorId, int $targetId): bool
    {
        $current = Department::find($targetId);
        $visited = [];

        while ($current !== null && $current->parent_id !== null) {
            if ($current->parent_id === $ancestorId) {
                return true;
            }

            if (in_array($current->id, $visited, true)) {
                break; // Cycle safeguard
            }
            $visited[] = $current->id;

            $current = Department::find($current->parent_id);
        }

        return false;
    }
}
