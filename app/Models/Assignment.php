<?php

namespace App\Models;

use App\Modules\Assessments\Policies\AssignmentPolicy;
use Database\Factories\AssignmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $module_id
 * @property string $title
 * @property string $instructions
 * @property Carbon|null $due_at
 * @property int $max_score
 * @property int $max_attempts
 * @property bool $is_required
 * @property string $status
 * @property int $created_by
 * @property Carbon|null $published_at
 * @property Carbon|null $closed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Module $module
 * @property-read User $creator
 */
#[Fillable([
    'module_id',
    'title',
    'instructions',
    'due_at',
    'max_score',
    'max_attempts',
    'is_required',
    'status',
    'created_by',
    'published_at',
    'closed_at',
])]
#[UsePolicy(AssignmentPolicy::class)]
class Assignment extends Model
{
    /** @use HasFactory<AssignmentFactory> */
    use HasFactory;

    public const STATUS_DRAFT = 'DRAFT';

    public const STATUS_PUBLISHED = 'PUBLISHED';

    public const STATUS_CLOSED = 'CLOSED';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_at' => 'datetime',
            'max_score' => 'integer',
            'max_attempts' => 'integer',
            'is_required' => 'boolean',
            'published_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Module, $this>
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /**
     * @return HasOneThrough<Course, Module, $this>
     */
    public function course(): HasOneThrough
    {
        return $this->hasOneThrough(
            Course::class,
            Module::class,
            'id', // Foreign key on modules table...
            'id', // Foreign key on courses table...
            'module_id', // Local key on assignments table...
            'course_id' // Local key on modules table...
        );
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<AssignmentSubmission, $this>
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    public function isClosed(): bool
    {
        return $this->status === self::STATUS_CLOSED;
    }

    public function isPastDue(): bool
    {
        return $this->due_at !== null && now()->greaterThan($this->due_at);
    }

    public function canAcceptSubmissions(): bool
    {
        return $this->isPublished() && ! $this->isPastDue();
    }

    /**
     * @param  Builder<Assignment>  $query
     * @return Builder<Assignment>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }
}
