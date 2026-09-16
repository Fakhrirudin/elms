<?php

namespace App\Modules\Certificates\Policies;

use App\Models\Certificate;
use App\Models\Enrollment;
use App\Models\Role;
use App\Models\User;

class CertificatePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Certificate $certificate): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        if ($user->hasRole(Role::INSTRUCTOR)) {
            $course = $certificate->enrollment?->course;

            return $course !== null && $course->instructors()->where('users.id', $user->id)->exists();
        }

        return $certificate->enrollment?->user_id === $user->id;
    }

    public function generate(User $user, Enrollment $enrollment): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $enrollment->user_id === $user->id && $user->hasRole(Role::EMPLOYEE);
    }

    private function isAdmin(User $user): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN);
    }
}

