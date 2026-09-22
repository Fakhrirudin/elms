<?php

namespace Tests\Feature\Api;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AssignmentSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    private User $instructor;

    private User $enrolledEmployee;

    private User $otherEmployee;

    private Course $course;

    private Module $module;

    private Assignment $assignment;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

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

        $this->enrolledEmployee = User::factory()->create([
            'role_id' => $employeeRole->id,
            'department_id' => $dept->id,
        ]);

        $this->otherEmployee = User::factory()->create([
            'role_id' => $employeeRole->id,
            'department_id' => $dept->id,
        ]);

        $this->course = Course::factory()->create([
            'status' => Course::STATUS_PUBLISHED,
        ]);

        $this->course->instructors()->attach($this->instructor->id);

        Enrollment::create([
            'user_id' => $this->enrolledEmployee->id,
            'course_id' => $this->course->id,
            'status' => Enrollment::STATUS_ENROLLED,
            'enrolled_at' => now(),
        ]);

        $this->module = Module::factory()->create([
            'course_id' => $this->course->id,
            'title' => 'Module 1: Practical Tasks',
            'sort_order' => 1,
        ]);

        $this->assignment = Assignment::factory()->create([
            'module_id' => $this->module->id,
            'created_by' => $this->instructor->id,
            'title' => 'Build a Microservice',
            'instructions' => 'Submit your zip archive or pdf report.',
            'due_at' => now()->addDays(3),
            'max_score' => 100,
            'max_attempts' => 2,
            'is_required' => true,
            'status' => Assignment::STATUS_PUBLISHED,
            'published_at' => now()->subDay(),
        ]);
    }

    public function test_enrolled_employee_can_view_published_assignment(): void
    {
        $response = $this->actingAs($this->enrolledEmployee, 'sanctum')
            ->getJson("/api/v1/assignments/{$this->assignment->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Build a Microservice')
            ->assertJsonPath('data.max_score', 100)
            ->assertJsonPath('data.max_attempts', 2);
    }

    public function test_non_enrolled_employee_cannot_view_assignment(): void
    {
        $response = $this->actingAs($this->otherEmployee, 'sanctum')
            ->getJson("/api/v1/assignments/{$this->assignment->id}");

        $response->assertStatus(403);
    }

    public function test_employee_cannot_view_draft_assignment(): void
    {
        $draftAssignment = Assignment::factory()->create([
            'module_id' => $this->module->id,
            'status' => Assignment::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($this->enrolledEmployee, 'sanctum')
            ->getJson("/api/v1/assignments/{$draftAssignment->id}");

        $response->assertStatus(403);
    }

    public function test_enrolled_employee_can_submit_assignment(): void
    {
        $file = UploadedFile::fake()->create('report.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->enrolledEmployee, 'sanctum')
            ->postJson("/api/v1/assignments/{$this->assignment->id}/submissions", [
                'file' => $file,
                'comment' => 'First attempt solution.',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.attempt_number', 1)
            ->assertJsonPath('data.status', 'SUBMITTED')
            ->assertJsonPath('data.original_filename', 'report.pdf')
            ->assertJsonPath('data.comment', 'First attempt solution.');

        $this->assertDatabaseHas('assignment_submissions', [
            'assignment_id' => $this->assignment->id,
            'user_id' => $this->enrolledEmployee->id,
            'attempt_number' => 1,
            'status' => 'SUBMITTED',
            'original_filename' => 'report.pdf',
        ]);

        /** @var AssignmentSubmission $submission */
        $submission = AssignmentSubmission::where('assignment_id', $this->assignment->id)
            ->where('user_id', $this->enrolledEmployee->id)
            ->first();

        Storage::disk('local')->assertExists($submission->file_path);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->instructor->id,
            'type' => 'ASSIGNMENT_SUBMITTED',
        ]);
    }

    public function test_null_deadline_allows_submission(): void
    {
        $openAssignment = Assignment::factory()->create([
            'module_id' => $this->module->id,
            'due_at' => null, // NULL semantics: no deadline
            'status' => Assignment::STATUS_PUBLISHED,
        ]);

        $file = UploadedFile::fake()->create('solution.docx', 300, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        $response = $this->actingAs($this->enrolledEmployee, 'sanctum')
            ->postJson("/api/v1/assignments/{$openAssignment->id}/submissions", [
                'file' => $file,
            ]);

        $response->assertStatus(201);
    }

    public function test_past_deadline_rejects_submission_with_422(): void
    {
        $expiredAssignment = Assignment::factory()->create([
            'module_id' => $this->module->id,
            'due_at' => now()->subHours(2),
            'status' => Assignment::STATUS_PUBLISHED,
        ]);

        $file = UploadedFile::fake()->create('late.pdf', 300, 'application/pdf');

        $response = $this->actingAs($this->enrolledEmployee, 'sanctum')
            ->postJson("/api/v1/assignments/{$expiredAssignment->id}/submissions", [
                'file' => $file,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['deadline']);
    }

    public function test_resubmission_blocked_while_pending_review(): void
    {
        // First submission created
        $file = UploadedFile::fake()->create('report.pdf', 500, 'application/pdf');
        $this->actingAs($this->enrolledEmployee, 'sanctum')
            ->postJson("/api/v1/assignments/{$this->assignment->id}/submissions", ['file' => $file]);

        // Attempting to submit again while attempt 1 is SUBMITTED
        $file2 = UploadedFile::fake()->create('report_v2.pdf', 500, 'application/pdf');
        $response = $this->actingAs($this->enrolledEmployee, 'sanctum')
            ->postJson("/api/v1/assignments/{$this->assignment->id}/submissions", ['file' => $file2]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['resubmission']);
    }

    public function test_resubmission_blocked_when_already_passed(): void
    {
        // Submission created & passed
        AssignmentSubmission::factory()->passed(95)->create([
            'assignment_id' => $this->assignment->id,
            'user_id' => $this->enrolledEmployee->id,
            'attempt_number' => 1,
        ]);

        $file = UploadedFile::fake()->create('attempt2.pdf', 500, 'application/pdf');
        $response = $this->actingAs($this->enrolledEmployee, 'sanctum')
            ->postJson("/api/v1/assignments/{$this->assignment->id}/submissions", ['file' => $file]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['resubmission']);
    }

    public function test_resubmission_allowed_when_needs_revision(): void
    {
        // Submission 1 needs revision
        AssignmentSubmission::factory()->needsRevision(50, 'Fix the unit tests.')->create([
            'assignment_id' => $this->assignment->id,
            'user_id' => $this->enrolledEmployee->id,
            'attempt_number' => 1,
        ]);

        $file2 = UploadedFile::fake()->create('report_attempt2.pdf', 500, 'application/pdf');
        $response = $this->actingAs($this->enrolledEmployee, 'sanctum')
            ->postJson("/api/v1/assignments/{$this->assignment->id}/submissions", [
                'file' => $file2,
                'comment' => 'Fixed unit tests as requested.',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.attempt_number', 2)
            ->assertJsonPath('data.status', 'SUBMITTED')
            ->assertJsonPath('data.score', null)
            ->assertJsonPath('data.feedback', null);

        $this->assertDatabaseHas('assignment_submissions', [
            'assignment_id' => $this->assignment->id,
            'user_id' => $this->enrolledEmployee->id,
            'attempt_number' => 2,
            'status' => 'SUBMITTED',
        ]);
    }

    public function test_submission_blocked_when_max_attempts_reached(): void
    {
        // Assignment has max_attempts = 2. Create 2 attempts:
        AssignmentSubmission::factory()->needsRevision(50)->create([
            'assignment_id' => $this->assignment->id,
            'user_id' => $this->enrolledEmployee->id,
            'attempt_number' => 1,
        ]);
        AssignmentSubmission::factory()->needsRevision(55)->create([
            'assignment_id' => $this->assignment->id,
            'user_id' => $this->enrolledEmployee->id,
            'attempt_number' => 2,
        ]);

        $file3 = UploadedFile::fake()->create('attempt3.pdf', 500, 'application/pdf');
        $response = $this->actingAs($this->enrolledEmployee, 'sanctum')
            ->postJson("/api/v1/assignments/{$this->assignment->id}/submissions", ['file' => $file3]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['attempts']);
    }

    public function test_instructor_can_start_review_and_grade_submission(): void
    {
        $submission = AssignmentSubmission::factory()->create([
            'assignment_id' => $this->assignment->id,
            'user_id' => $this->enrolledEmployee->id,
            'attempt_number' => 1,
            'status' => AssignmentSubmission::STATUS_SUBMITTED,
        ]);

        // Start review
        $startResponse = $this->actingAs($this->instructor, 'sanctum')
            ->postJson("/api/v1/assignment-submissions/{$submission->id}/start-review");

        $startResponse->assertStatus(200)
            ->assertJsonPath('data.status', 'UNDER_REVIEW');

        // Review with NEEDS_REVISION requires feedback
        $failReview = $this->actingAs($this->instructor, 'sanctum')
            ->postJson("/api/v1/assignment-submissions/{$submission->id}/review", [
                'status' => 'NEEDS_REVISION',
                'score' => 60,
                'feedback' => '', // missing feedback
            ]);
        $failReview->assertStatus(422)->assertJsonValidationErrors(['feedback']);

        // Score cannot exceed max_score
        $failScore = $this->actingAs($this->instructor, 'sanctum')
            ->postJson("/api/v1/assignment-submissions/{$submission->id}/review", [
                'status' => 'PASSED',
                'score' => 105, // assignment.max_score is 100
                'feedback' => 'Nice effort.',
            ]);
        $failScore->assertStatus(422)->assertJsonValidationErrors(['score']);

        // Valid PASSED review
        $passReview = $this->actingAs($this->instructor, 'sanctum')
            ->postJson("/api/v1/assignment-submissions/{$submission->id}/review", [
                'status' => 'PASSED',
                'score' => 95,
                'feedback' => 'Excellent architecture and code organization.',
            ]);

        $passReview->assertStatus(200)
            ->assertJsonPath('data.status', 'PASSED')
            ->assertJsonPath('data.score', 95)
            ->assertJsonPath('data.feedback', 'Excellent architecture and code organization.');

        $this->assertDatabaseHas('assignment_submissions', [
            'id' => $submission->id,
            'status' => 'PASSED',
            'score' => 95,
            'reviewed_by' => $this->instructor->id,
        ]);

        // Verified in-app notification created for the employee
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->enrolledEmployee->id,
            'type' => 'ASSIGNMENT_REVIEWED',
        ]);
    }

    public function test_authorized_users_can_download_submission_file_while_unauthorized_blocked(): void
    {
        $filePath = 'assignments/submissions/test_submission.pdf';
        Storage::disk('local')->put($filePath, 'PDF CONTENT DUMMY');

        $submission = AssignmentSubmission::factory()->create([
            'assignment_id' => $this->assignment->id,
            'user_id' => $this->enrolledEmployee->id,
            'file_path' => $filePath,
            'original_filename' => 'my_work.pdf',
            'mime_type' => 'application/pdf',
        ]);

        // 1. Owner can download
        $ownerResponse = $this->actingAs($this->enrolledEmployee, 'sanctum')
            ->get("/api/v1/assignment-submissions/{$submission->id}/download");
        $ownerResponse->assertStatus(200);

        // 2. Instructor can download
        $instructorResponse = $this->actingAs($this->instructor, 'sanctum')
            ->get("/api/v1/assignment-submissions/{$submission->id}/download");
        $instructorResponse->assertStatus(200);

        // 3. Admin can download
        $adminResponse = $this->actingAs($this->superAdmin, 'sanctum')
            ->get("/api/v1/assignment-submissions/{$submission->id}/download");
        $adminResponse->assertStatus(200);

        // 4. Other unauthorized employee gets 403
        $otherResponse = $this->actingAs($this->otherEmployee, 'sanctum')
            ->get("/api/v1/assignment-submissions/{$submission->id}/download");
        $otherResponse->assertStatus(403);
    }
}
