<?php

namespace App\Modules\Users\Services;

use App\Models\Role;
use App\Models\User;
use App\Modules\Users\Exceptions\UserAuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class UserService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = min((int) ($filters['per_page'] ?? 10), 100);

        return User::query()
            ->with(['role', 'department'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('employee_number', 'like', "%{$search}%");
                });
            })
            ->when($filters['role'] ?? null, function ($query, $role) {
                $query->whereHas('role', fn ($query) => $query->where('name', $role));
            })
            ->when($filters['department_id'] ?? null, function ($query, $departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->when(
                array_key_exists('is_active', $filters) && $filters['is_active'] !== null,
                fn ($query) => $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN))
            )
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(User $actor, array $data): User
    {
        $this->guardRoleAssignment($actor, (int) $data['role_id'], null);

        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role_id' => $data['role_id'],
            'department_id' => $data['department_id'] ?? null,
            'employee_number' => $data['employee_number'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $actor, User $target, array $data): User
    {
        if (array_key_exists('role_id', $data)) {
            $this->guardRoleAssignment($actor, (int) $data['role_id'], $target);
        }

        $target->fill(array_intersect_key($data, array_flip([
            'name', 'email', 'role_id', 'department_id', 'employee_number',
        ])));
        $target->save();

        return $target;
    }

    public function updateStatus(User $target, bool $isActive): User
    {
        $target->update(['is_active' => $isActive]);

        return $target;
    }

    /**
     * Prevent self role-escalation and stop LEARNING_ADMIN from granting
     * admin-tier roles it is not allowed to manage.
     *
     * @throws UserAuthorizationException
     */
    private function guardRoleAssignment(User $actor, int $roleId, ?User $target): void
    {
        if ($target && $actor->is($target) && $roleId !== $target->role_id) {
            throw new UserAuthorizationException('You cannot change your own role.');
        }

        if ($actor->hasRole(Role::LEARNING_ADMIN)) {
            $roleName = Role::query()->whereKey($roleId)->value('name');

            if (in_array($roleName, [Role::SUPER_ADMIN, Role::LEARNING_ADMIN], true)) {
                throw new UserAuthorizationException('You are not authorized to assign this role.');
            }
        }
    }
}
