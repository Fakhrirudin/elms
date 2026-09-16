<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminRole = Role::where('name', Role::SUPER_ADMIN)->firstOrFail();
        $learningAdminRole = Role::where('name', Role::LEARNING_ADMIN)->firstOrFail();
        $instructorRole = Role::where('name', Role::INSTRUCTOR)->firstOrFail();
        $employeeRole = Role::where('name', Role::EMPLOYEE)->firstOrFail();

        $tiDept = Department::where('name', 'Pusat Teknologi Informasi dan Komunikasi')->first();
        $sdmDept = Department::where('name', 'Biro Sumber Daya Manusia')->first();
        $diklatDept = Department::where('name', 'Bagian Pelatihan dan Pengembangan')->first();
        $diplomasiDept = Department::where('name', 'Direktorat Diplomasi Publik')->first();

        $passwordHash = Hash::make('Password123!');

        // 1. Super Admin
        User::query()->updateOrCreate(
            ['email' => 'superadmin@elms.test'],
            [
                'role_id' => $superAdminRole->id,
                'department_id' => $tiDept?->id,
                'name' => 'Super Administrator',
                'employee_number' => '198501012010011001',
                'password' => $passwordHash,
                'is_active' => true,
            ]
        );

        // 2. Learning Admin
        User::query()->updateOrCreate(
            ['email' => 'learningadmin@elms.test'],
            [
                'role_id' => $learningAdminRole->id,
                'department_id' => $diklatDept?->id,
                'name' => 'Learning Administrator',
                'employee_number' => '198703152012022001',
                'password' => $passwordHash,
                'is_active' => true,
            ]
        );

        // 3. Instructor
        User::query()->updateOrCreate(
            ['email' => 'instructor@elms.test'],
            [
                'role_id' => $instructorRole->id,
                'department_id' => $tiDept?->id,
                'name' => 'Dr. Budi Santoso',
                'employee_number' => '198005202008011002',
                'password' => $passwordHash,
                'is_active' => true,
            ]
        );

        // 4. Primary Test Employee
        User::query()->updateOrCreate(
            ['email' => 'employee@elms.test'],
            [
                'role_id' => $employeeRole->id,
                'department_id' => $diplomasiDept?->id,
                'name' => 'Siti Rahmawati',
                'employee_number' => '199507102020122003',
                'password' => $passwordHash,
                'is_active' => true,
            ]
        );

        // 5. Additional Realistic Employees across departments
        $additionalEmployees = [
            [
                'email' => 'ahmad.fauzi@elms.test',
                'name' => 'Ahmad Fauzi',
                'employee_number' => '199204122018011004',
                'department_id' => $tiDept?->id,
            ],
            [
                'email' => 'dewi.lestari@elms.test',
                'name' => 'Dewi Lestari',
                'employee_number' => '199408222019032005',
                'department_id' => $sdmDept?->id,
            ],
            [
                'email' => 'rizky.pratama@elms.test',
                'name' => 'Rizky Pratama',
                'employee_number' => '199611302021021006',
                'department_id' => $diplomasiDept?->id,
            ],
        ];

        foreach ($additionalEmployees as $emp) {
            User::query()->updateOrCreate(
                ['email' => $emp['email']],
                array_merge($emp, [
                    'role_id' => $employeeRole->id,
                    'password' => $passwordHash,
                    'is_active' => true,
                ])
            );
        }
    }
}
