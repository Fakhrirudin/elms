<?php

namespace Tests\Feature\Api;

use App\Models\Course;
use App\Models\Material;
use App\Models\Module;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MaterialTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(User $user): string
    {
        return $user->createToken('test')->plainTextToken;
    }

    private function userWithRole(string $roleName): User
    {
        $role = Role::query()->firstOrCreate(['name' => $roleName], ['description' => $roleName]);

        return User::factory()->create(['role_id' => $role->id]);
    }

    public function test_admin_can_create_text_material(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $module = Module::factory()->create();

        $payload = [
            'title' => 'Text Lesson',
            'type' => Material::TYPE_TEXT,
            'content' => 'This is the textual lesson content.',
            'is_mandatory' => true,
        ];

        $response = $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/modules/{$module->id}/materials", $payload);

        $response->assertCreated();
        $response->assertJsonPath('data.title', 'Text Lesson');
        $response->assertJsonPath('data.type', Material::TYPE_TEXT);
        $response->assertJsonPath('data.content', 'This is the textual lesson content.');
        $response->assertJsonPath('data.sort_order', 0);
        $this->assertDatabaseHas('materials', [
            'module_id' => $module->id,
            'title' => 'Text Lesson',
            'type' => Material::TYPE_TEXT,
        ]);
    }

    public function test_admin_can_create_video_material(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $module = Module::factory()->create();

        $payload = [
            'title' => 'Video Lesson',
            'type' => Material::TYPE_VIDEO,
            'video_url' => 'https://example.com/watch?v=12345',
            'is_mandatory' => false,
        ];

        $response = $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/modules/{$module->id}/materials", $payload);

        $response->assertCreated();
        $response->assertJsonPath('data.type', Material::TYPE_VIDEO);
        $response->assertJsonPath('data.video_url', 'https://example.com/watch?v=12345');
        $response->assertJsonPath('data.is_mandatory', false);
    }

    public function test_admin_can_create_pdf_material_with_file_upload(): void
    {
        Storage::fake('local');

        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $module = Module::factory()->create();
        $file = UploadedFile::fake()->create('sample_handout.pdf', 500, 'application/pdf');

        $response = $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/modules/{$module->id}/materials", [
                'title' => 'PDF Handout',
                'type' => Material::TYPE_PDF,
                'file' => $file,
            ]);

        $response->assertCreated();
        $response->assertJsonPath('data.type', Material::TYPE_PDF);

        $filePath = $response->json('data.file_path');
        $this->assertNotNull($filePath);
        Storage::disk('local')->assertExists($filePath);
    }

    public function test_material_creation_requires_type_specific_content(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $module = Module::factory()->create();

        // TEXT requires content
        $resText = $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/modules/{$module->id}/materials", [
                'title' => 'Incomplete Text',
                'type' => Material::TYPE_TEXT,
            ]);
        $resText->assertStatus(422);
        $resText->assertJsonValidationErrors(['content']);

        // PDF requires file
        $resPdf = $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/modules/{$module->id}/materials", [
                'title' => 'Incomplete PDF',
                'type' => Material::TYPE_PDF,
            ]);
        $resPdf->assertStatus(422);
        $resPdf->assertJsonValidationErrors(['file']);

        // VIDEO requires video_url
        $resVideo = $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/modules/{$module->id}/materials", [
                'title' => 'Incomplete Video',
                'type' => Material::TYPE_VIDEO,
            ]);
        $resVideo->assertStatus(422);
        $resVideo->assertJsonValidationErrors(['video_url']);
    }

    public function test_assigned_instructor_can_create_material(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();
        $course->instructors()->attach($instructor->id);
        $module = Module::factory()->create(['course_id' => $course->id]);

        $response = $this->withToken($this->tokenFor($instructor))
            ->postJson("/api/v1/modules/{$module->id}/materials", [
                'title' => 'Instructor Material',
                'type' => Material::TYPE_TEXT,
                'content' => 'Instructor notes.',
            ]);

        $response->assertCreated();
        $this->assertDatabaseHas('materials', [
            'module_id' => $module->id,
            'title' => 'Instructor Material',
        ]);
    }

    public function test_unassigned_instructor_cannot_create_material(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);

        $response = $this->withToken($this->tokenFor($instructor))
            ->postJson("/api/v1/modules/{$module->id}/materials", [
                'title' => 'Unauthorized Material',
                'type' => Material::TYPE_TEXT,
                'content' => 'Notes',
            ]);

        $response->assertForbidden();
    }

    public function test_employee_cannot_create_material(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $module = Module::factory()->create();

        $response = $this->withToken($this->tokenFor($employee))
            ->postJson("/api/v1/modules/{$module->id}/materials", [
                'title' => 'Unauthorized Material',
                'type' => Material::TYPE_TEXT,
                'content' => 'Notes',
            ]);

        $response->assertForbidden();
    }

    public function test_employee_can_view_materials_of_published_course(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $material = Material::factory()->text()->create(['module_id' => $module->id]);

        $showResponse = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/materials/{$material->id}");
        $showResponse->assertOk();

        $listResponse = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/modules/{$module->id}/materials");
        $listResponse->assertOk();
    }

    public function test_employee_cannot_view_materials_of_draft_course(): void
    {
        $employee = $this->userWithRole(Role::EMPLOYEE);
        $course = Course::factory()->draft()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $material = Material::factory()->text()->create(['module_id' => $module->id]);

        $showResponse = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/materials/{$material->id}");
        $showResponse->assertForbidden();

        $listResponse = $this->withToken($this->tokenFor($employee))
            ->getJson("/api/v1/modules/{$module->id}/materials");
        $listResponse->assertForbidden();
    }

    public function test_assigned_instructor_can_update_material(): void
    {
        $instructor = $this->userWithRole(Role::INSTRUCTOR);
        $course = Course::factory()->create();
        $course->instructors()->attach($instructor->id);
        $module = Module::factory()->create(['course_id' => $course->id]);
        $material = Material::factory()->text()->create(['module_id' => $module->id]);

        $response = $this->withToken($this->tokenFor($instructor))
            ->putJson("/api/v1/materials/{$material->id}", [
                'title' => 'Updated Material Title',
                'content' => 'Updated content text.',
                'is_mandatory' => false,
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.title', 'Updated Material Title');
        $response->assertJsonPath('data.is_mandatory', false);
    }

    public function test_updating_pdf_material_with_new_file_replaces_old_file(): void
    {
        Storage::fake('local');

        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $module = Module::factory()->create();
        $oldFile = UploadedFile::fake()->create('old.pdf', 300, 'application/pdf');

        $createResponse = $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/modules/{$module->id}/materials", [
                'title' => 'PDF Doc',
                'type' => Material::TYPE_PDF,
                'file' => $oldFile,
            ]);
        $createResponse->assertCreated();
        $oldPath = $createResponse->json('data.file_path');
        Storage::disk('local')->assertExists($oldPath);

        $materialId = $createResponse->json('data.id');
        $newFile = UploadedFile::fake()->create('new.pdf', 400, 'application/pdf');

        $updateResponse = $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/materials/{$materialId}", [
                '_method' => 'PUT',
                'title' => 'Updated PDF Doc',
                'file' => $newFile,
            ]);
        $updateResponse->assertOk();
        $newPath = $updateResponse->json('data.file_path');

        $this->assertNotEquals($oldPath, $newPath);
        Storage::disk('local')->assertMissing($oldPath);
        Storage::disk('local')->assertExists($newPath);
    }

    public function test_delete_material_removes_file_from_disk(): void
    {
        Storage::fake('local');

        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $module = Module::factory()->create();
        $file = UploadedFile::fake()->create('doc.pdf', 300, 'application/pdf');

        $createResponse = $this->withToken($this->tokenFor($admin))
            ->postJson("/api/v1/modules/{$module->id}/materials", [
                'title' => 'PDF Doc to delete',
                'type' => Material::TYPE_PDF,
                'file' => $file,
            ]);
        $materialId = $createResponse->json('data.id');
        $filePath = $createResponse->json('data.file_path');
        Storage::disk('local')->assertExists($filePath);

        $deleteResponse = $this->withToken($this->tokenFor($admin))
            ->deleteJson("/api/v1/materials/{$materialId}");

        $deleteResponse->assertOk();
        $this->assertDatabaseMissing('materials', ['id' => $materialId]);
        Storage::disk('local')->assertMissing($filePath);
    }

    public function test_reorder_materials_successfully(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $module = Module::factory()->create();
        $mat1 = Material::factory()->text()->create(['module_id' => $module->id, 'sort_order' => 1]);
        $mat2 = Material::factory()->text()->create(['module_id' => $module->id, 'sort_order' => 2]);
        $mat3 = Material::factory()->text()->create(['module_id' => $module->id, 'sort_order' => 3]);

        $payload = [
            'materials' => [
                ['id' => $mat1->id, 'sort_order' => 3],
                ['id' => $mat2->id, 'sort_order' => 1],
                ['id' => $mat3->id, 'sort_order' => 2],
            ],
        ];

        $response = $this->withToken($this->tokenFor($admin))
            ->patchJson("/api/v1/modules/{$module->id}/materials/reorder", $payload);

        $response->assertOk();
        $this->assertEquals(3, $mat1->fresh()->sort_order);
        $this->assertEquals(1, $mat2->fresh()->sort_order);
        $this->assertEquals(2, $mat3->fresh()->sort_order);
    }

    public function test_reorder_materials_rejects_material_from_different_module(): void
    {
        $admin = $this->userWithRole(Role::SUPER_ADMIN);
        $moduleA = Module::factory()->create();
        $moduleB = Module::factory()->create();
        $matA = Material::factory()->text()->create(['module_id' => $moduleA->id, 'sort_order' => 1]);
        $matB = Material::factory()->text()->create(['module_id' => $moduleB->id, 'sort_order' => 2]);

        $payload = [
            'materials' => [
                ['id' => $matA->id, 'sort_order' => 2],
                ['id' => $matB->id, 'sort_order' => 1],
            ],
        ];

        $response = $this->withToken($this->tokenFor($admin))
            ->patchJson("/api/v1/modules/{$moduleA->id}/materials/reorder", $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['materials']);
    }
}
