<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Notification;
use App\Models\Quiz;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_populates_baseline_data_cleanly_and_idempotently(): void
    {
        // First run
        $this->seed(DatabaseSeeder::class);

        // Assert Roles
        $this->assertDatabaseHas('roles', ['name' => Role::SUPER_ADMIN]);
        $this->assertDatabaseHas('roles', ['name' => Role::LEARNING_ADMIN]);
        $this->assertDatabaseHas('roles', ['name' => Role::INSTRUCTOR]);
        $this->assertDatabaseHas('roles', ['name' => Role::EMPLOYEE]);
        $this->assertEquals(4, Role::count());

        // Assert Departments
        $this->assertDatabaseHas('departments', ['name' => 'Pusat Teknologi Informasi dan Komunikasi']);
        $this->assertDatabaseHas('departments', ['name' => 'Biro Sumber Daya Manusia']);
        $this->assertGreaterThanOrEqual(4, Department::count());

        // Assert Development Users
        $this->assertDatabaseHas('users', ['email' => 'superadmin@elms.test']);
        $this->assertDatabaseHas('users', ['email' => 'learningadmin@elms.test']);
        $this->assertDatabaseHas('users', ['email' => 'instructor@elms.test']);
        $this->assertDatabaseHas('users', ['email' => 'employee@elms.test']);

        // Assert Courses and Categories
        $this->assertDatabaseHas('categories', ['slug' => 'software-engineering']);
        $this->assertDatabaseHas('courses', ['slug' => 'arsitektur-web-enterprise-modern', 'status' => Course::STATUS_PUBLISHED]);

        // Assert Quizzes
        $this->assertDatabaseHas('quizzes', ['title' => 'Evaluasi Arsitektur & Transaksi Web', 'status' => Quiz::STATUS_PUBLISHED]);

        // Assert Enrollments, Certificates, Notifications
        $this->assertGreaterThanOrEqual(2, Enrollment::count());
        $this->assertGreaterThanOrEqual(1, Certificate::count());
        $this->assertGreaterThanOrEqual(3, Notification::count());

        // Second run to verify idempotency
        $this->seed(DatabaseSeeder::class);

        // Core entity counts must remain unchanged on repeated runs
        $this->assertEquals(4, Role::count());
        $this->assertEquals(4, Category::count());
        $this->assertEquals(3, Course::count());
        $this->assertEquals(7, User::count());
        $this->assertEquals(6, Department::count());
        $this->assertEquals(2, Quiz::count());
        $this->assertEquals(3, Enrollment::count());
        $this->assertEquals(1, Certificate::count());
    }
}
