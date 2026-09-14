<?php

namespace App\Modules\Courses\Policies;

use App\Models\Course;
use App\Models\Role;
use App\Models\User;

class CoursePolicy
{
    /**
     * Determine whether the user can view any courses.
     * Listing visibility and scoping are enforced at the service query level.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the specific course.
     */
    public function view(User $user, Course $course): bool
    {
        if ($user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN)) {
            return true;
        }

        if ($user->hasRole(Role::INSTRUCTOR)) {
            return $course->status === Course::STATUS_PUBLISHED
                || $course->instructors()->where('users.id', $user->id)->exists();
        }

        return $course->status === Course::STATUS_PUBLISHED;
    }

    /**
     * Determine whether the user can create courses.
     */
    public function create(User $user): bool
    {
        return $this->isAdmin($user);
    }

    /**
     * Determine whether the user can update the course metadata.
     * Per Decision 4: Only Admins can update course metadata in Task 04.
     */
    public function update(User $user, Course $course): bool
    {
        return $this->isAdmin($user);
    }

    /**
     * Determine whether the user can delete the course.
     */
    public function delete(User $user, Course $course): bool
    {
        return $this->isAdmin($user);
    }

    /**
     * Determine whether the user can update the course status.
     */
    public function updateStatus(User $user, Course $course): bool
    {
        return $this->isAdmin($user);
    }

    /**
     * Determine whether the user can assign, sync, or remove instructors.
     */
    public function manageInstructors(User $user, Course $course): bool
    {
        return $this->isAdmin($user);
    }

    private function isAdmin(User $user): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN);
    }
}
