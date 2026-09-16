<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database in proper dependency order.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            DepartmentSeeder::class,
            UserSeeder::class,
            CategorySeeder::class,
            CourseSeeder::class,
            QuizSeeder::class,
            EnrollmentProgressSeeder::class,
            NotificationSeeder::class,
        ]);
    }
}
