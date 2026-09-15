<?php

namespace App\Modules\Courses\Services;

use App\Models\Material;
use App\Models\Module;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MaterialService
{
    /**
     * @return Collection<int, Material>
     */
    public function listForModule(Module $module): Collection
    {
        return $module->materials()
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Module $module, array $data, ?UploadedFile $file = null): Material
    {
        if ($data['type'] === Material::TYPE_PDF && $file !== null) {
            $data['file_path'] = $file->store('materials/pdf', 'local');
            $data['content'] = null;
            $data['video_url'] = null;
        } elseif ($data['type'] === Material::TYPE_TEXT) {
            $data['file_path'] = null;
            $data['video_url'] = null;
        } elseif ($data['type'] === Material::TYPE_VIDEO) {
            $data['file_path'] = null;
            $data['content'] = null;
        }

        if (! isset($data['sort_order'])) {
            $maxSortOrder = $module->materials()->max('sort_order');
            $data['sort_order'] = $maxSortOrder !== null ? $maxSortOrder + 1 : 0;
        }

        if (! isset($data['is_mandatory'])) {
            $data['is_mandatory'] = true;
        }

        unset($data['file']);

        return $module->materials()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Material $material, array $data, ?UploadedFile $file = null): Material
    {
        if ($file !== null) {
            if ($material->file_path && Storage::disk('local')->exists($material->file_path)) {
                Storage::disk('local')->delete($material->file_path);
            }

            $data['file_path'] = $file->store('materials/pdf', 'local');
            $data['content'] = null;
            $data['video_url'] = null;
            $data['type'] = Material::TYPE_PDF;
        } elseif (isset($data['type'])) {
            if ($data['type'] === Material::TYPE_TEXT) {
                if ($material->file_path && Storage::disk('local')->exists($material->file_path)) {
                    Storage::disk('local')->delete($material->file_path);
                }
                $data['file_path'] = null;
                $data['video_url'] = null;
            } elseif ($data['type'] === Material::TYPE_VIDEO) {
                if ($material->file_path && Storage::disk('local')->exists($material->file_path)) {
                    Storage::disk('local')->delete($material->file_path);
                }
                $data['file_path'] = null;
                $data['content'] = null;
            }
        }

        unset($data['file']);

        $material->update($data);

        return $material->fresh();
    }

    public function delete(Material $material): void
    {
        if ($material->file_path && Storage::disk('local')->exists($material->file_path)) {
            Storage::disk('local')->delete($material->file_path);
        }

        $material->delete();
    }

    /**
     * @param  array<int, array{id: int, sort_order: int}>  $materialOrders
     *
     * @throws ValidationException
     */
    public function reorder(Module $module, array $materialOrders): void
    {
        $materialIds = array_column($materialOrders, 'id');
        $moduleMaterialCount = $module->materials()->whereIn('id', $materialIds)->count();

        if ($moduleMaterialCount !== count($materialIds)) {
            throw ValidationException::withMessages([
                'materials' => ['One or more materials do not belong to this module.'],
            ]);
        }

        DB::transaction(function () use ($materialOrders) {
            foreach ($materialOrders as $item) {
                Material::where('id', $item['id'])->update([
                    'sort_order' => $item['sort_order'],
                ]);
            }
        });
    }
}
