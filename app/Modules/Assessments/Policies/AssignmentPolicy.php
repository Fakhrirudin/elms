<?php

namespace App\Modules\Assessments\Policies;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\Role;
use App\Models\User;

class AssignmentPolicy
{
    public function view(User $user, Assignment $assignment): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        if ($user->hasRole(Role::INSTRUCTOR)) {
            return $this->isAssignedInstructor($user, $assignment)
                || ($assignment->isPublished() && $assignment->module?->course?->status === Course::STATUS_PUBLISHED);
        }

        if ($user->hasRole(Role::EMPLOYEE)) {
            $course = $assignment->module?->course;
            if (! $course || $course->status !== Course::STATUS_PUBLISHED || ! $assignment->isPublished()) {
                return false;
            }

            return Enrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->exists();
        }

        return false;
    }

    public function create(User $user, Module $module): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructorForModule($user, $module);
    }

    public function update(User $user, Assignment $assignment): bool
    {
        if ($assignment->isClosed()) {
            return false;
        }

        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $assignment);
    }

    public function delete(User $user, Assignment $assignment): bool
    {
        // Business Rule: Assignment may only be deleted when it has zero submissions.
        if ($assignment->submissions()->count() > 0) {
            return false;
        }

        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $assignment);
    }

    public function publish(User $user, Assignment $assignment): bool
    {
        if (! $assignment->isDraft()) {
            return false;
        }

        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $assignment);
    }

    public function close(User $user, Assignment $assignment): bool
    {
        if (! $assignment->isPublished()) {
            return false;
        }

        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $assignment);
    }

    public function submit(User $user, Assignment $assignment): bool
    {
        if (! $user->hasRole(Role::EMPLOYEE)) {
            return false;
        }

        $course = $assignment->module?->course;
        if (! $course || $course->status !== Course::STATUS_PUBLISHED || ! $assignment->isPublished()) {
            return false;
        }

        return Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->exists();
    }

    public function viewSubmissions(User $user, Assignment $assignment): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $assignment);
    }

    private function isAdmin(User $user): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN);
    }

    private function isAssignedInstructor(User $user, Assignment $assignment): bool
    {
        $course = $assignment->module?->course;

        return $course !== null && $course->instructors()->where('users.id', $user->id)->exists();
    }

    private function isAssignedInstructorForModule(User $user, Module $module): bool
    {
        $course = $module->course;

        return $course !== null && $course->instructors()->where('users.id', $user->id)->exists();
    }
}
