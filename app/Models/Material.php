<?php

namespace App\Models;

use App\Modules\Courses\Policies\MaterialPolicy;
use Database\Factories\MaterialFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $module_id
 * @property string $title
 * @property string $type
 * @property string|null $content
 * @property string|null $file_path
 * @property string|null $video_url
 * @property int $sort_order
 * @property bool $is_mandatory
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Module $module
 */
#[Fillable(['module_id', 'title', 'type', 'content', 'file_path', 'video_url', 'sort_order', 'is_mandatory'])]
#[UsePolicy(MaterialPolicy::class)]
class Material extends Model
{
    /** @use HasFactory<MaterialFactory> */
    use HasFactory;

    public const TYPE_TEXT = 'TEXT';

    public const TYPE_PDF = 'PDF';

    public const TYPE_VIDEO = 'VIDEO';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_mandatory' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Module, $this>
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }
}
