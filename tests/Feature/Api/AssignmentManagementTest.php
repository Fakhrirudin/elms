<?php

namespace Tests\Feature\Api;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\Department;
use App\Models\Module;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssignmentManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    private User $instructor;

    private User $unassignedInstructor;

    private User $employee;

    private Course $course;

    private Module $module;

    protected function setUp(): void
    {
        parent::setUp();

        $dept = Department::factory()->create();

        $adminRole = Role::factory()->create(['name' => Role::SUPER_ADMIN]);
        $instructorRole = Role::factory()->create(['name' => Role::INSTRUCTOR]);
        $employeeRole = Role::factory()->create(['name' => Role::EMPLOYEE]);

        $this->superAdmin = User::factory()->create([
            'role_id' => $adminRole->id,
            'department_id' => $dept->id,
        ]);

        $this->instructor = User::factory()->create([
            'role_id' => $instructorRole->id,
            'department_id' => $dept->id,
        ]);

        $this->unassignedInstructor = User::factory()->create([
            'role_id' => $instructorRole->id,
            'department_id' => $dept->id,
        ]);

        $this->employee = User::factory()->create([
            'role_id' => $employeeRole->id,
            'department_id' => $dept->id,
        ]);

        $this->course = Course::factory()->create([
            'status' => Course::STATUS_PUBLISHED,
        ]);

        $this->course->instructors()->attach($this->instructor->id);

        $this->module = Module::factory()->create([
            'course_id' => $this->course->id,
            'title' => 'Module 1: Foundations',
            'sort_order' => 1,
        ]);
    }

    public function test_admin_can_create_assignment_in_module(): void
    {
        $payload = [
            'title' => 'Build a REST API',
            'instructions' => 'Implement authentication and CRUD for books.',
            'due_at' => now()->addDays(7)->toISOString(),
            'max_score' => 100,
            'max_attempts' => 2,
            'is_required' => true,
        ];

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/modules/{$this->module->id}/assignments", $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Build a REST API')
            ->assertJsonPath('data.status', 'DRAFT')
            ->assertJsonPath('data.max_score', 100)
            ->assertJsonPath('data.max_attempts', 2)
            ->assertJsonPath('data.is_required', true);

        $this->assertDatabaseHas('assignments', [
            'module_id' => $this->module->id,
            'title' => 'Build a REST API',
            'status' => 'DRAFT',
            'created_by' => $this->superAdmin->id,
        ]);
    }

    public function test_assigned_instructor_can_create_assignment_in_module(): void
    {
        $payload = [
            'title' => 'Database Schema Design',
            'instructions' => 'Create ERD diagram and migration plan.',
            'due_at' => now()->addDays(5)->toISOString(),
            'max_score' => 80,
            'max_attempts' => 3,
            'is_required' => false,
        ];

        $response = $this->actingAs($this->instructor, 'sanctum')
            ->postJson("/api/v1/modules/{$this->module->id}/assignments", $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Database Schema Design')
            ->assertJsonPath('data.status', 'DRAFT');
    }

    public function test_unassigned_instructor_cannot_create_assignment(): void
    {
        $payload = [
            'title' => 'Unauthorized Assignment',
            'instructions' => 'This should fail.',
        ];

        $response = $this->actingAs($this->unassignedInstructor, 'sanctum')
            ->postJson("/api/v1/modules/{$this->module->id}/assignments", $payload);

        $response->assertStatus(403);
    }

    public function test_employee_cannot_create_assignment(): void
    {
        $payload = [
            'title' => 'Employee Hack Assignment',
            'instructions' => 'This should fail.',
        ];

        $response = $this->actingAs($this->employee, 'sanctum')
            ->postJson("/api/v1/modules/{$this->module->id}/assignments", $payload);

        $response->assertStatus(403);
    }

    public function test_admin_and_instructor_can_update_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'module_id' => $this->module->id,
            'created_by' => $this->instructor->id,
            'status' => Assignment::STATUS_DRAFT,
            'title' => 'Old Title',
            'max_score' => 100,
        ]);

        $response = $this->actingAs($this->instructor, 'sanctum')
            ->patchJson("/api/v1/assignments/{$assignment->id}", [
                'title' => 'Updated Title by Instructor',
                'max_score' => 150,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Updated Title by Instructor')
            ->assertJsonPath('data.max_score', 150);

        $this->assertDatabaseHas('assignments', [
            'id' => $assignment->id,
            'title' => 'Updated Title by Instructor',
            'max_score' => 150,
        ]);
    }

    public function test_cannot_update_closed_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'module_id' => $this->module->id,
            'created_by' => $this->superAdmin->id,
            'status' => Assignment::STATUS_CLOSED,
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->patchJson("/api/v1/assignments/{$assignment->id}", [
                'title' => 'Attempting To Edit Closed',
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_and_instructor_can_publish_draft_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'module_id' => $this->module->id,
            'created_by' => $this->instructor->id,
            'status' => Assignment::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->instructor, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/publish");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'PUBLISHED');

        $this->assertDatabaseHas('assignments', [
            'id' => $assignment->id,
            'status' => 'PUBLISHED',
        ]);
        $this->assertNotNull($assignment->fresh()->published_at);
    }

    public function test_cannot_publish_non_draft_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'module_id' => $this->module->id,
            'created_by' => $this->superAdmin->id,
            'status' => Assignment::STATUS_PUBLISHED,
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/publish");

        $response->assertStatus(403);
    }

    public function test_admin_and_instructor_can_close_published_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'module_id' => $this->module->id,
            'created_by' => $this->instructor->id,
            'status' => Assignment::STATUS_PUBLISHED,
            'published_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->instructor, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/close");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'CLOSED');

        $this->assertDatabaseHas('assignments', [
            'id' => $assignment->id,
            'status' => 'CLOSED',
        ]);
        $this->assertNotNull($assignment->fresh()->closed_at);
    }

    public function test_can_delete_assignment_with_zero_submissions(): void
    {
        $assignment = Assignment::factory()->create([
            'module_id' => $this->module->id,
            'created_by' => $this->instructor->id,
            'status' => Assignment::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->instructor, 'sanctum')
            ->deleteJson("/api/v1/assignments/{$assignment->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('assignments', [
            'id' => $assignment->id,
        ]);
    }

    public function test_cannot_delete_assignment_with_submissions(): void
    {
        $assignment = Assignment::factory()->create([
            'module_id' => $this->module->id,
            'created_by' => $this->instructor->id,
            'status' => Assignment::STATUS_PUBLISHED,
        ]);

        AssignmentSubmission::factory()->create([
            'assignment_id' => $assignment->id,
            'user_id' => $this->employee->id,
        ]);

        $response = $this->actingAs($this->instructor, 'sanctum')
            ->deleteJson("/api/v1/assignments/{$assignment->id}");

        $response->assertStatus(403);

        $this->assertDatabaseHas('assignments', [
            'id' => $assignment->id,
        ]);
    }

    public function test_authoring_list_for_module_returns_all_status_assignments(): void
    {
        Assignment::factory()->create([
            'module_id' => $this->module->id,
            'title' => 'Draft Assignment',
            'status' => Assignment::STATUS_DRAFT,
        ]);
        Assignment::factory()->create([
            'module_id' => $this->module->id,
            'title' => 'Published Assignment',
            'status' => Assignment::STATUS_PUBLISHED,
        ]);
        Assignment::factory()->create([
            'module_id' => $this->module->id,
            'title' => 'Closed Assignment',
            'status' => Assignment::STATUS_CLOSED,
        ]);

        $response = $this->actingAs($this->instructor, 'sanctum')
            ->getJson("/api/v1/modules/{$this->module->id}/assignments");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data');
    }
}
