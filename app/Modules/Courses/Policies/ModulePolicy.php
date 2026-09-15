<?php

namespace App\Modules\Courses\Policies;

use App\Models\Course;
use App\Models\Module;
use App\Models\Role;
use App\Models\User;

class ModulePolicy
{
    public function viewAny(User $user, Course $course): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        if ($user->hasRole(Role::INSTRUCTOR)) {
            return $course->status === Course::STATUS_PUBLISHED
                || $this->isAssignedInstructor($user, $course);
        }

        return $course->status === Course::STATUS_PUBLISHED;
    }

    public function view(User $user, Module $module): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        $course = $module->course;

        if ($user->hasRole(Role::INSTRUCTOR)) {
            return $course->status === Course::STATUS_PUBLISHED
                || $this->isAssignedInstructor($user, $course);
        }

        return $course->status === Course::STATUS_PUBLISHED;
    }

    public function create(User $user, Course $course): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $course);
    }

    public function update(User $user, Module $module): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $module->course);
    }

    public function delete(User $user, Module $module): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $module->course);
    }

    public function reorder(User $user, Course $course): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $course);
    }

    private function isAdmin(User $user): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN);
    }

    private function isAssignedInstructor(User $user, Course $course): bool
    {
        return $course->instructors()->where('users.id', $user->id)->exists();
    }
}
