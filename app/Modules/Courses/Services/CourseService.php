<?php

namespace App\Modules\Courses\Services;

use App\Models\Course;
use App\Models\Role;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CourseService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginate(User $actor, array $filters): LengthAwarePaginator
    {
        $perPage = min((int) ($filters['per_page'] ?? 10), 100);

        return Course::query()
            ->with(['category', 'instructors'])
            ->tap(function ($query) use ($actor, $filters) {
                // Role-based visibility scoping
                if ($actor->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN)) {
                    if (! empty($filters['status'])) {
                        $query->where('status', $filters['status']);
                    }
                } elseif ($actor->hasRole(Role::INSTRUCTOR)) {
                    $query->where(function ($q) use ($actor) {
                        $q->where('status', Course::STATUS_PUBLISHED)
                            ->orWhereHas('instructors', fn ($iq) => $iq->where('users.id', $actor->id));
                    });

                    if (! empty($filters['status'])) {
                        $query->where('status', $filters['status']);
                    }
                } else {
                    // Employee and any other roles can only see PUBLISHED courses
                    $query->where('status', Course::STATUS_PUBLISHED);
                }
            })
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($filters['category_id'] ?? null, function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->when($filters['instructor_id'] ?? null, function ($query, $instructorId) {
                $query->whereHas('instructors', fn ($iq) => $iq->where('users.id', $instructorId));
            })
            ->tap(function ($query) use ($filters) {
                $sortBy = $filters['sort_by'] ?? 'created_at';
                $sortDirection = strtolower($filters['sort_direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

                if (! in_array($sortBy, ['created_at', 'title', 'published_at'], true)) {
                    $sortBy = 'created_at';
                }

                $query->orderBy($sortBy, $sortDirection);
            })
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(User $actor, array $data): Course
    {
        $slug = $this->generateUniqueSlug($data['title']);

        return Course::create([
            'category_id' => $data['category_id'],
            'title' => $data['title'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'thumbnail' => $data['thumbnail'] ?? null,
            'estimated_duration' => $data['estimated_duration'] ?? null,
            'status' => Course::STATUS_DRAFT,
            'published_at' => null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Course $course, array $data): Course
    {
        if (isset($data['title']) && $data['title'] !== $course->title) {
            $data['slug'] = $this->generateUniqueSlug($data['title'], $course->id);
        }

        $course->fill(array_intersect_key($data, array_flip([
            'category_id', 'title', 'slug', 'description', 'thumbnail', 'estimated_duration',
        ])));
        $course->save();

        return $course;
    }

    public function updateStatus(Course $course, string $status): Course
    {
        if ($status === Course::STATUS_PUBLISHED && ! $course->published_at) {
            $course->published_at = now();
        }

        $course->status = $status;
        $course->save();

        return $course;
    }

    public function delete(Course $course): void
    {
        $course->delete();
    }

    /**
     * @throws ValidationException
     */
    public function assignInstructor(Course $course, int $userId): Course
    {
        $instructor = User::with('role')->findOrFail($userId);

        if (! $instructor->hasRole(Role::INSTRUCTOR)) {
            throw ValidationException::withMessages([
                'user_id' => ['The selected user must have the INSTRUCTOR role.'],
            ]);
        }

        $course->instructors()->syncWithoutDetaching([$userId]);
        $course->load('instructors');

        return $course;
    }

    /**
     * @param  array<int>  $userIds
     *
     * @throws ValidationException
     */
    public function syncInstructors(Course $course, array $userIds): Course
    {
        if (! empty($userIds)) {
            $instructors = User::with('role')->whereIn('id', $userIds)->get();

            $invalid = $instructors->filter(fn ($user) => ! $user->hasRole(Role::INSTRUCTOR));

            if ($invalid->isNotEmpty() || $instructors->count() !== count(array_unique($userIds))) {
                throw ValidationException::withMessages([
                    'instructor_ids' => ['All assigned users must have the INSTRUCTOR role.'],
                ]);
            }
        }

        $course->instructors()->sync($userIds);
        $course->load('instructors');

        return $course;
    }

    public function removeInstructor(Course $course, int $userId): Course
    {
        $course->instructors()->detach($userId);
        $course->load('instructors');

        return $course;
    }

    private function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        while (Course::query()
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
