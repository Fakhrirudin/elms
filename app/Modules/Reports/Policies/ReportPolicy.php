<?php

namespace App\Modules\Reports\Policies;

use App\Models\Role;
use App\Models\User;

class ReportPolicy
{
    public function viewDashboard(User $user): bool
    {
        return true;
    }

    public function viewCourseReport(User $user): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN, Role::INSTRUCTOR);
    }

    public function viewLearningReport(User $user): bool
    {
        return true;
    }

    public function viewQuizReport(User $user): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN, Role::INSTRUCTOR);
    }
}

