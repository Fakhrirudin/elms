<?php

namespace App\Modules\Learning\Policies;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Role;
use App\Models\User;

class EnrollmentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Enrollment $enrollment): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $enrollment->user_id === $user->id;
    }

    public function enroll(User $user, Course $course): bool
    {
        if (! $user->hasRole(Role::EMPLOYEE) || ! $user->is_active) {
            return false;
        }

        return $course->status === Course::STATUS_PUBLISHED;
    }

    private function isAdmin(User $user): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN);
    }
}

