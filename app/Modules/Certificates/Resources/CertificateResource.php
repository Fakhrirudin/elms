<?php

namespace App\Modules\Certificates\Resources;

use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Certificate
 */
class CertificateResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $enrollment = $this->enrollment;
        $course = $enrollment?->course;
        $user = $enrollment?->user;

        return [
            'id' => $this->id,
            'certificate_number' => $this->certificate_number,
            'enrollment_id' => $this->enrollment_id,
            'course' => [
                'id' => $course?->id,
                'title' => $course?->title,
                'slug' => $course?->slug,
            ],
            'employee' => [
                'id' => $user?->id,
                'name' => $user?->name,
                'nip' => $user?->nip,
            ],
            'issued_at' => $this->issued_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}

