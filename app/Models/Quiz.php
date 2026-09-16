<?php

namespace App\Models;

use App\Modules\Assessments\Policies\QuizPolicy;
use Database\Factories\QuizFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $module_id
 * @property string $title
 * @property string|null $description
 * @property float $passing_grade
 * @property int $max_attempts
 * @property int|null $time_limit_minutes
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Module $module
 */
#[Fillable(['module_id', 'title', 'description', 'passing_grade', 'max_attempts', 'time_limit_minutes', 'status'])]
#[UsePolicy(QuizPolicy::class)]
class Quiz extends Model
{
    /** @use HasFactory<QuizFactory> */
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
            'passing_grade' => 'float',
            'max_attempts' => 'integer',
            'time_limit_minutes' => 'integer',
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
     * @return HasMany<Question, $this>
     */
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<QuizAttempt, $this>
     */
    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }
}
