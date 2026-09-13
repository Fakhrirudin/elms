<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Seed the four MVP roles required by docs/requirements.md §25.
     */
    public function run(): void
    {
        collect([
            [
                'name' => Role::SUPER_ADMIN,
                'description' => 'Full access to all system functionality.',
            ],
            [
                'name' => Role::LEARNING_ADMIN,
                'description' => 'Manages courses, learning content, and reports.',
            ],
            [
                'name' => Role::INSTRUCTOR,
                'description' => 'Manages assigned courses and their learning content.',
            ],
            [
                'name' => Role::EMPLOYEE,
                'description' => 'Enrolls in courses and completes learning activities.',
            ],
        ])->each(fn (array $role) => Role::query()->updateOrCreate(
            ['name' => $role['name']],
            $role,
        ));
    }
}
