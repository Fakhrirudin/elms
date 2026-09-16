<?php

namespace App\Modules\Assessments\Policies;

use App\Models\QuizAttempt;
use App\Models\Role;
use App\Models\User;

class QuizAttemptPolicy
{
    public function view(User $user, QuizAttempt $attempt): bool
    {
        if ($attempt->user_id === $user->id) {
            return true;
        }

        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $attempt);
    }

    public function submit(User $user, QuizAttempt $attempt): bool
    {
        return $attempt->user_id === $user->id && $user->hasRole(Role::EMPLOYEE);
    }

    private function isAdmin(User $user): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN);
    }

    private function isAssignedInstructor(User $user, QuizAttempt $attempt): bool
    {
        $course = $attempt->quiz?->module?->course;

        return $course !== null && $course->instructors()->where('users.id', $user->id)->exists();
    }
}

