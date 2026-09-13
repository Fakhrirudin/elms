<?php

namespace App\Modules\Users\Policies;

use App\Models\Role;
use App\Models\User;

/**
 * Coarse role-based access (SUPER_ADMIN/LEARNING_ADMIN only) is enforced by
 * the `role` route middleware. This policy adds the record-level rule that
 * LEARNING_ADMIN may not manage accounts holding an admin-tier role.
 */
class UserPolicy
{
    public function update(User $actor, User $target): bool
    {
        return $this->canManage($actor, $target);
    }

    public function updateStatus(User $actor, User $target): bool
    {
        return $this->canManage($actor, $target);
    }

    private function canManage(User $actor, User $target): bool
    {
        if ($actor->hasRole(Role::SUPER_ADMIN)) {
            return true;
        }

        if ($actor->hasRole(Role::LEARNING_ADMIN)) {
            return ! $target->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN);
        }

        return false;
    }
}
