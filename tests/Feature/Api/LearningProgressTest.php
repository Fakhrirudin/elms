<?php

namespace Tests\Feature\Api;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\Module;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LearningProgressTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(User $user): string
    {
        return $user->createToken('test')->plainTextToken;
    }

    private function userWithRole(string $roleName, bool $isActive = true): User
    {
        $role = Role::query()->firstOrCreate(['name' => $roleName], ['description' => $roleName]);

        return User::factory()->create([
            'role_id' => $role->id,
            'is_active' => $isActive,
        ]);
    }

    public function test_employee_can_mark_material_as_completed(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $material = Material::factory()->text()->create([
            'module_id' => $module->id,
            'is_mandatory' => true,
        ]);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $course->id,
            'status' => Enrollment::STATUS_ENROLLED,
        ]);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$material->id}/complete");

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'material_id',
                'completed_at',
                'progress',
            ],
        ]);
        $response->assertJsonPath('data.material_id', $material->id);
        $response->assertJsonPath('data.progress', 100);

        $this->assertDatabaseHas('material_progress', [
            'enrollment_id' => $enrollment->id,
            'material_id' => $material->id,
        ]);
    }

    public function test_marking_material_completed_transitions_status_to_in_progress(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $mat1 = Material::factory()->text()->create(['module_id' => $module->id, 'is_mandatory' => true]);
        $mat2 = Material::factory()->text()->create(['module_id' => $module->id, 'is_mandatory' => true]);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $course->id,
            'status' => Enrollment::STATUS_ENROLLED,
        ]);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$mat1->id}/complete");

        $response->assertOk();
        $response->assertJsonPath('data.progress', 50);

        $enrollment->refresh();
        $this->assertEquals(Enrollment::STATUS_IN_PROGRESS, $enrollment->status);
        $this->assertNull($enrollment->completed_at);
    }

    public function test_completing_all_mandatory_materials_transitions_status_to_completed(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $mat1 = Material::factory()->text()->create(['module_id' => $module->id, 'is_mandatory' => true]);
        $mat2 = Material::factory()->text()->create(['module_id' => $module->id, 'is_mandatory' => true]);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $course->id,
            'status' => Enrollment::STATUS_ENROLLED,
        ]);

        $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$mat1->id}/complete")
            ->assertOk();

        $response2 = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$mat2->id}/complete");

        $response2->assertOk();
        $response2->assertJsonPath('data.progress', 100);

        $enrollment->refresh();
        $this->assertEquals(Enrollment::STATUS_COMPLETED, $enrollment->status);
        $this->assertNotNull($enrollment->completed_at);
    }

    public function test_completing_material_is_idempotent(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $material = Material::factory()->text()->create(['module_id' => $module->id, 'is_mandatory' => true]);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $course->id,
        ]);

        $res1 = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$material->id}/complete");
        $res1->assertOk();

        $res2 = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$material->id}/complete");
        $res2->assertOk();
        $res2->assertJsonPath('data.progress', 100);

        $this->assertEquals(1, $enrollment->materialProgress()->count());
    }

    public function test_optional_material_does_not_distort_mandatory_progress_calculation(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $mandatoryMat = Material::factory()->text()->create(['module_id' => $module->id, 'is_mandatory' => true]);
        $optionalMat = Material::factory()->text()->create(['module_id' => $module->id, 'is_mandatory' => false]);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $course->id,
            'status' => Enrollment::STATUS_ENROLLED,
        ]);

        // Complete optional material first
        $resOpt = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$optionalMat->id}/complete");
        $resOpt->assertOk();
        $resOpt->assertJsonPath('data.progress', 0);

        $enrollment->refresh();
        $this->assertEquals(Enrollment::STATUS_IN_PROGRESS, $enrollment->status);

        // Complete mandatory material
        $resMand = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$mandatoryMat->id}/complete");
        $resMand->assertOk();
        $resMand->assertJsonPath('data.progress', 100);

        $enrollment->refresh();
        $this->assertEquals(Enrollment::STATUS_COMPLETED, $enrollment->status);
    }

    public function test_employee_cannot_complete_material_from_another_course(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $courseA = Course::factory()->published()->create();
        $courseB = Course::factory()->published()->create();

        $moduleB = Module::factory()->create(['course_id' => $courseB->id]);
        $materialB = Material::factory()->text()->create(['module_id' => $moduleB->id]);

        $enrollmentA = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $courseA->id,
        ]);

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/enrollments/{$enrollmentA->id}/materials/{$materialB->id}/complete");

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['material']);
    }

    public function test_employee_cannot_complete_material_for_another_user_enrollment(): void
    {
        $employeeA = $this->userWithRole(Role::EMPLOYEE);
        $employeeB = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $material = Material::factory()->text()->create(['module_id' => $module->id]);

        $enrollmentB = Enrollment::factory()->create([
            'user_id' => $employeeB->id,
            'course_id' => $course->id,
        ]);

        $response = $this->withToken($this->tokenFor($employeeA))
            ->postJson("/api/v1/enrollments/{$enrollmentB->id}/materials/{$material->id}/complete");

        $response->assertForbidden();
    }

    public function test_admin_and_instructor_cannot_complete_material_for_employee(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $employee = $this->userWithRole(Role::EMPLOYEE);

        $course = Course::factory()->published()->create();
        $course->instructors()->attach($instructor->id);
        $module = Module::factory()->create(['course_id' => $course->id]);
        $material = Material::factory()->text()->create(['module_id' => $module->id]);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $course->id,
        ]);

        $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$material->id}/complete")
            ->assertForbidden();

        $this->withToken($this->tokenFor($instructor))
            ->postJson("/api/v1/enrollments/{$enrollment->id}/materials/{$material->id}/complete")
            ->assertForbidden();
    }

    public function test_employee_can_view_own_enrollment_progress(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $mat1 = Material::factory()->text()->create(['module_id' => $module->id, 'is_mandatory' => true]);
        $mat2 = Material::factory()->text()->create(['module_id' => $module->id, 'is_mandatory' => true]);

        $enrollment = Enrollment::factory()->inProgress()->create([
            'user_id' => $employee->id,
            'course_id' => $course->id,
        ]);

        // Complete 1 material
        $enrollment->materialProgress()->create([
            'material_id' => $mat1->id,
            'completed_at' => now(),
        ]);

        $response = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/enrollments/{$enrollment->id}/progress");

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'enrollment_id',
                'course_id',
                'status',
                'progress',
                'total_mandatory_materials',
                'completed_mandatory_materials',
            ],
        ]);
        $response->assertJsonPath('data.enrollment_id', $enrollment->id);
        $response->assertJsonPath('data.course_id', $course->id);
        $response->assertJsonPath('data.progress', 50);
        $response->assertJsonPath('data.total_mandatory_materials', 2);
        $response->assertJsonPath('data.completed_mandatory_materials', 1);
    }

    public function test_employee_cannot_view_other_user_enrollment_progress(): void
    {
        $employeeA = $this->userWithRole(Role::EMPLOYEE);
        $employeeB = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();

        $enrollmentB = Enrollment::factory()->create([
            'user_id' => $employeeB->id,
            'course_id' => $course->id,
        ]);

        $response = $this->withToken($this->tokenFor($employeeA))
            ->getJson("/api/v1/enrollments/{$enrollmentB->id}/progress");

        $response->assertForbidden();
    }

    public function test_admin_can_view_any_enrollment_progress(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $course->id,
        ]);

        $response = $this->withToken($this->tokenFor($admin))
            ->getJson("/api/v1/enrollments/{$enrollment->id}/progress");

        $response->assertOk();
        $response->assertJsonPath('data.enrollment_id', $enrollment->id);
    }

    public function test_assigned_instructor_can_view_enrollment_progress_for_their_course(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();
        $course->instructors()->attach($instructor->id);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $course->id,
        ]);

        $response = $this->withToken($this->tokenFor($instructor))
            ->getJson("/api/v1/enrollments/{$enrollment->id}/progress");

        $response->assertOk();
        $response->assertJsonPath('data.enrollment_id', $enrollment->id);
    }

    public function test_unassigned_instructor_cannot_view_enrollment_progress(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();

        $enrollment = Enrollment::factory()->create([
            'user_id' => $employee->id,
            'course_id' => $course->id,
        ]);

        $response = $this->withToken($this->tokenFor($instructor))
            ->getJson("/api/v1/enrollments/{$enrollment->id}/progress");

        $response->assertForbidden();
    }
}
