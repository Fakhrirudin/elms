<?php

namespace App\Modules\Learning\Services;

use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialProgress;
use Illuminate\Validation\ValidationException;

class LearningProgressService
{
    /**
     * @return array{total_mandatory: int, completed_mandatory: int, progress: int}
     */
    public function calculateProgress(Enrollment $enrollment): array
    {
        $courseId = $enrollment->course_id;

        $mandatoryMaterialIds = Material::query()
            ->whereHas('module', function ($query) use ($courseId) {
                $query->where('course_id', $courseId);
            })
            ->where('is_mandatory', true)
            ->pluck('id');

        $totalMandatory = $mandatoryMaterialIds->count();

        $completedMandatory = $enrollment->materialProgress()
            ->whereIn('material_id', $mandatoryMaterialIds)
            ->count();

        $progress = $totalMandatory > 0
            ? (int) round(($completedMandatory / $totalMandatory) * 100)
            : 100;

        return [
            'total_mandatory' => $totalMandatory,
            'completed_mandatory' => $completedMandatory,
            'progress' => $progress,
        ];
    }

    /**
     * @return array{enrollment_id: int, course_id: int, status: string, progress: int, total_mandatory_materials: int, completed_mandatory_materials: int}
     */
    public function getProgress(Enrollment $enrollment): array
    {
        $calc = $this->calculateProgress($enrollment);

        return [
            'enrollment_id' => $enrollment->id,
            'course_id' => $enrollment->course_id,
            'status' => $enrollment->status,
            'progress' => $calc['progress'],
            'total_mandatory_materials' => $calc['total_mandatory'],
            'completed_mandatory_materials' => $calc['completed_mandatory'],
        ];
    }

    /**
     * @return array{material_id: int, completed_at: mixed, progress: int}
     *
     * @throws ValidationException
     */
    public function completeMaterial(Enrollment $enrollment, Material $material): array
    {
        if ($material->module->course_id !== $enrollment->course_id) {
            throw ValidationException::withMessages([
                'material' => ['The material does not belong to the enrolled course.'],
            ]);
        }

        $progressRecord = MaterialProgress::firstOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'material_id' => $material->id,
            ],
            [
                'completed_at' => now(),
            ]
        );

        $calc = $this->calculateProgress($enrollment);

        if ($calc['total_mandatory'] > 0) {
            if ($calc['completed_mandatory'] === $calc['total_mandatory']) {
                $enrollment->status = Enrollment::STATUS_COMPLETED;
                $enrollment->completed_at = $enrollment->completed_at ?? now();
                $enrollment->save();
            } elseif ($enrollment->status === Enrollment::STATUS_ENROLLED) {
                $enrollment->status = Enrollment::STATUS_IN_PROGRESS;
                $enrollment->save();
            }
        } else {
            $enrollment->status = Enrollment::STATUS_COMPLETED;
            $enrollment->completed_at = $enrollment->completed_at ?? now();
            $enrollment->save();
        }

        return [
            'material_id' => $material->id,
            'completed_at' => $progressRecord->completed_at,
            'progress' => $calc['progress'],
        ];
    }
}
