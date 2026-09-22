<?php

namespace App\Modules\Courses\Services;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Module;
use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ModuleService
{
    /**
     * @return Collection<int, Module>
     */
    public function listForCourse(Course $course): Collection
    {
        $user = auth()->user();
        $isLearner = $user && $user->hasRole(Role::EMPLOYEE);

        return $course->modules()
            ->with([
                'materials',
                'assignments' => function ($query) use ($isLearner) {
                    if ($isLearner) {
                        $query->where('status', Assignment::STATUS_PUBLISHED);
                    }
                    $query->withCount('submissions')->orderBy('id');
                },
            ])
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Course $course, array $data): Module
    {
        if (! isset($data['sort_order'])) {
            $maxSortOrder = $course->modules()->max('sort_order');
            $data['sort_order'] = $maxSortOrder !== null ? $maxSortOrder + 1 : 0;
        }

        $module = $course->modules()->create($data);

        return $module->load(['materials', 'assignments']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Module $module, array $data): Module
    {
        $module->update($data);

        return $module->fresh(['materials']);
    }

    public function delete(Module $module): void
    {
        foreach ($module->materials as $material) {
            if ($material->file_path && Storage::disk('local')->exists($material->file_path)) {
                Storage::disk('local')->delete($material->file_path);
            }
        }

        $module->delete();
    }

    /**
     * @param  array<int, array{id: int, sort_order: int}>  $moduleOrders
     *
     * @throws ValidationException
     */
    public function reorder(Course $course, array $moduleOrders): void
    {
        $moduleIds = array_column($moduleOrders, 'id');
        $courseModuleCount = $course->modules()->whereIn('id', $moduleIds)->count();

        if ($courseModuleCount !== count($moduleIds)) {
            throw ValidationException::withMessages([
                'modules' => ['One or more modules do not belong to this course.'],
            ]);
        }

        DB::transaction(function () use ($moduleOrders) {
            foreach ($moduleOrders as $item) {
                Module::where('id', $item['id'])->update([
                    'sort_order' => $item['sort_order'],
                ]);
            }
        });
    }
}
