<?php

namespace App\Modules\Assessments\Policies;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\Quiz;
use App\Models\Role;
use App\Models\User;

class QuizPolicy
{
    public function view(User $user, Quiz $quiz): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        if ($user->hasRole(Role::INSTRUCTOR)) {
            return $this->isAssignedInstructor($user, $quiz)
                || ($quiz->status === Quiz::STATUS_PUBLISHED && $quiz->module?->course?->status === Course::STATUS_PUBLISHED);
        }

        if ($user->hasRole(Role::EMPLOYEE)) {
            $course = $quiz->module?->course;
            if (! $course || $course->status !== Course::STATUS_PUBLISHED || $quiz->status !== Quiz::STATUS_PUBLISHED) {
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

    public function update(User $user, Quiz $quiz): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $quiz);
    }

    public function delete(User $user, Quiz $quiz): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $quiz);
    }

    public function updateStatus(User $user, Quiz $quiz): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $quiz);
    }

    public function startAttempt(User $user, Quiz $quiz): bool
    {
        if (! $user->hasRole(Role::EMPLOYEE)) {
            return false;
        }

        $course = $quiz->module?->course;
        if (! $course || $course->status !== Course::STATUS_PUBLISHED || $quiz->status !== Quiz::STATUS_PUBLISHED) {
            return false;
        }

        return Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->exists();
    }

    private function isAdmin(User $user): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN);
    }

    private function isAssignedInstructor(User $user, Quiz $quiz): bool
    {
        $course = $quiz->module?->course;

        return $course !== null && $course->instructors()->where('users.id', $user->id)->exists();
    }

    private function isAssignedInstructorForModule(User $user, Module $module): bool
    {
        $course = $module->course;

        return $course !== null && $course->instructors()->where('users.id', $user->id)->exists();
    }
}

