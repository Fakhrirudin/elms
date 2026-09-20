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
     * Admins and Instructors are authorized to create courses.
     */
    public function create(User $user): bool
    {
        return $this->isAdmin($user) || $user->hasRole(Role::INSTRUCTOR);
    }

    /**
     * Determine whether the user can update the course metadata.
     * Admins can update any course; Instructors can only update assigned courses.
     */
    public function update(User $user, Course $course): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructor($user, $course);
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
     * Publishing and archiving are strictly reserved for Admins.
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

    private function isAssignedInstructor(User $user, Course $course): bool
    {
        return $course->instructors()->where('users.id', $user->id)->exists();
    }
}
