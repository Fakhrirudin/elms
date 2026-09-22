<?php

namespace App\Modules\Assessments\Services;

use App\Models\Assignment;
use App\Models\Module;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class AssignmentService
{
    /**
     * @return Collection<int, Assignment>
     */
    public function listForModule(Module $module): Collection
    {
        return $module->assignments()
            ->withCount('submissions')
            ->orderBy('id')
            ->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Module $module, User $user, array $data): Assignment
    {
        $data['created_by'] = $user->id;
        $data['status'] = Assignment::STATUS_DRAFT;

        return $module->assignments()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Assignment $assignment, array $data): Assignment
    {
        if ($assignment->isClosed()) {
            throw ValidationException::withMessages([
                'assignment' => 'Cannot modify an assignment that is already closed.',
            ]);
        }

        $assignment->update($data);

        return $assignment;
    }

    public function delete(Assignment $assignment): void
    {
        if ($assignment->submissions()->count() > 0) {
            throw ValidationException::withMessages([
                'assignment' => 'Cannot delete an assignment that already has learner submissions. Use close to retire it.',
            ]);
        }

        $assignment->delete();
    }

    public function publish(Assignment $assignment): Assignment
    {
        if (! $assignment->isDraft()) {
            throw ValidationException::withMessages([
                'status' => 'Only draft assignments can be published.',
            ]);
        }

        $assignment->update([
            'status' => Assignment::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);

        return $assignment;
    }

    public function close(Assignment $assignment): Assignment
    {
        if (! $assignment->isPublished()) {
            throw ValidationException::withMessages([
                'status' => 'Only published assignments can be closed.',
            ]);
        }

        $assignment->update([
            'status' => Assignment::STATUS_CLOSED,
            'closed_at' => now(),
        ]);

        return $assignment;
    }
}
