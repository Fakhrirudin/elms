<?php

namespace App\Models;

use App\Modules\Assessments\Policies\AssignmentSubmissionPolicy;
use Database\Factories\AssignmentSubmissionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $assignment_id
 * @property int $user_id
 * @property int $attempt_number
 * @property string $file_path
 * @property string $original_filename
 * @property string $mime_type
 * @property int $file_size
 * @property string|null $comment
 * @property string $status
 * @property Carbon $submitted_at
 * @property int|null $score
 * @property string|null $feedback
 * @property int|null $reviewed_by
 * @property Carbon|null $reviewed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Assignment $assignment
 * @property-read User $user
 * @property-read User|null $reviewer
 */
#[Fillable([
    'assignment_id',
    'user_id',
    'attempt_number',
    'file_path',
    'original_filename',
    'mime_type',
    'file_size',
    'comment',
    'status',
    'submitted_at',
    'score',
    'feedback',
    'reviewed_by',
    'reviewed_at',
])]
#[UsePolicy(AssignmentSubmissionPolicy::class)]
class AssignmentSubmission extends Model
{
    /** @use HasFactory<AssignmentSubmissionFactory> */
    use HasFactory;

    public const STATUS_SUBMITTED = 'SUBMITTED';

    public const STATUS_UNDER_REVIEW = 'UNDER_REVIEW';

    public const STATUS_PASSED = 'PASSED';

    public const STATUS_NEEDS_REVISION = 'NEEDS_REVISION';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'attempt_number' => 'integer',
            'file_size' => 'integer',
            'score' => 'integer',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Assignment, $this>
     */
    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function isSubmitted(): bool
    {
        return $this->status === self::STATUS_SUBMITTED;
    }

    public function isUnderReview(): bool
    {
        return $this->status === self::STATUS_UNDER_REVIEW;
    }

    public function isPassed(): bool
    {
        return $this->status === self::STATUS_PASSED;
    }

    public function needsRevision(): bool
    {
        return $this->status === self::STATUS_NEEDS_REVISION;
    }

    public function isReviewed(): bool
    {
        return $this->isPassed() || $this->needsRevision();
    }
}
