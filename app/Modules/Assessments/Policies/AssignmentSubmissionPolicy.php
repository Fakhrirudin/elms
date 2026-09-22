<?php

namespace App\Modules\Assessments\Policies;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Role;
use App\Models\User;

class AssignmentSubmissionPolicy
{
    public function view(User $user, AssignmentSubmission $submission): bool
    {
        if ($submission->user_id === $user->id) {
            return true;
        }

        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $submission);
    }

    public function viewAny(User $user, Assignment $assignment): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        $course = $assignment->module?->course;

        return $user->hasRole(Role::INSTRUCTOR)
            && $course !== null
            && $course->instructors()->where('users.id', $user->id)->exists();
    }

    public function startReview(User $user, AssignmentSubmission $submission): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $submission);
    }

    public function review(User $user, AssignmentSubmission $submission): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $submission);
    }

    public function download(User $user, AssignmentSubmission $submission): bool
    {
        if ($submission->user_id === $user->id) {
            return true;
        }

        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $submission);
    }

    private function isAdmin(User $user): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN);
    }

    private function isAssignedInstructor(User $user, AssignmentSubmission $submission): bool
    {
        $course = $submission->assignment?->module?->course;

        return $course !== null && $course->instructors()->where('users.id', $user->id)->exists();
    }
}
