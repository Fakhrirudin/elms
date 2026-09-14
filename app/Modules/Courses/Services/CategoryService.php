<?php

namespace App\Modules\Courses\Services;

use App\Models\Category;
use App\Modules\Courses\Exceptions\CategoryInUseException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class CategoryService
{
    /**
     * @return Collection<int, Category>
     */
    public function list(): Collection
    {
        return Category::query()->orderBy('name')->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Category
    {
        $slug = $this->generateUniqueSlug($data['name']);

        return Category::create([
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Category $category, array $data): Category
    {
        if (isset($data['name']) && $data['name'] !== $category->name) {
            $data['slug'] = $this->generateUniqueSlug($data['name'], $category->id);
        }

        $category->fill(array_intersect_key($data, array_flip([
            'name', 'slug', 'description',
        ])));
        $category->save();

        return $category;
    }

    /**
     * @throws CategoryInUseException
     */
    public function delete(Category $category): void
    {
        if ($category->courses()->exists()) {
            throw new CategoryInUseException('Cannot delete category that is currently used by courses.');
        }

        $category->delete();
    }

    private function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while (Category::query()
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
