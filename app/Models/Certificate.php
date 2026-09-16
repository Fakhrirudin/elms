<?php

namespace App\Models;

use App\Modules\Certificates\Policies\CertificatePolicy;
use Database\Factories\CertificateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $enrollment_id
 * @property string $certificate_number
 * @property Carbon $issued_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Enrollment $enrollment
 * @property-read User|null $user
 * @property-read Course|null $course
 */
#[Fillable(['enrollment_id', 'certificate_number', 'issued_at'])]
#[UsePolicy(CertificatePolicy::class)]
class Certificate extends Model
{
    /** @use HasFactory<CertificateFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'issued_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Enrollment, $this>
     */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    /**
     * @return HasOneThrough<User, Enrollment, $this>
     */
    public function user(): HasOneThrough
    {
        return $this->hasOneThrough(
            User::class,
            Enrollment::class,
            'id',
            'id',
            'enrollment_id',
            'user_id'
        );
    }

    /**
     * @return HasOneThrough<Course, Enrollment, $this>
     */
    public function course(): HasOneThrough
    {
        return $this->hasOneThrough(
            Course::class,
            Enrollment::class,
            'id',
            'id',
            'enrollment_id',
            'course_id'
        );
    }
}
