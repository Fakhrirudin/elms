<?php

namespace App\Modules\Users\Policies;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;

class DepartmentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Department $department): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN);
    }

    public function update(User $user, Department $department): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN);
    }

    public function delete(User $user, Department $department): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN);
    }
}
