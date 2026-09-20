<?php

namespace App\Models;

use App\Modules\Courses\Policies\CoursePolicy;
use Database\Factories\CourseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $category_id
 * @property string $title
 * @property string $slug
 * @property string|null $description
 * @property string|null $thumbnail
 * @property int|null $estimated_duration
 * @property string $status
 * @property Carbon|null $published_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Category $category
 */
#[Fillable(['category_id', 'title', 'slug', 'description', 'thumbnail', 'estimated_duration', 'status', 'published_at'])]
#[UsePolicy(CoursePolicy::class)]
class Course extends Model
{
    /** @use HasFactory<CourseFactory> */
    use HasFactory;

    public const STATUS_DRAFT = 'DRAFT';

    public const STATUS_PUBLISHED = 'PUBLISHED';

    public const STATUS_ARCHIVED = 'ARCHIVED';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'estimated_duration' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function instructors(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'course_instructors');
    }

    /**
     * @return HasMany<Module, $this>
     */
    public function modules(): HasMany
    {
        return $this->hasMany(Module::class)->orderBy('sort_order');
    }

    /**
     * @return HasManyThrough<Material, Module, $this>
     */
    public function materials(): HasManyThrough
    {
        return $this->hasManyThrough(Material::class, Module::class);
    }

    /**
     * @return HasMany<Enrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * @return HasManyThrough<Certificate, Enrollment, $this>
     */
    public function certificates(): HasManyThrough
    {
        return $this->hasManyThrough(Certificate::class, Enrollment::class);
    }
}
