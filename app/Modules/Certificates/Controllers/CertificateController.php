<?php

namespace App\Modules\Certificates\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Modules\Certificates\Resources\CertificateResource;
use App\Modules\Certificates\Services\CertificateService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    public function __construct(private readonly CertificateService $certificateService) {}

    public function issue(Request $request, Enrollment $enrollment): JsonResponse
    {
        $this->authorize('generate', [Certificate::class, $enrollment]);

        $alreadyExisted = $enrollment->certificate()->exists();

        $certificate = $this->certificateService->generateCertificate($enrollment);

        if ($alreadyExisted) {
            return ApiResponse::success(
                new CertificateResource($certificate),
                'Certificate already issued',
                200,
            );
        }

        return ApiResponse::success(
            new CertificateResource($certificate),
            'Certificate issued successfully',
            201,
        );
    }

    public function myCertificates(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Certificate::class);

        $certificates = $this->certificateService->listMyCertificates($request->user());

        return ApiResponse::paginated(
            CertificateResource::collection($certificates),
            $certificates,
            'My certificates retrieved successfully',
        );
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Certificate::class);

        $certificates = $this->certificateService->listCertificates(
            $request->only(['course_id', 'user_id'])
        );

        return ApiResponse::paginated(
            CertificateResource::collection($certificates),
            $certificates,
            'Certificates retrieved successfully',
        );
    }

    public function show(Certificate $certificate): JsonResponse
    {
        $this->authorize('view', $certificate);

        $certificate = $this->certificateService->getCertificate($certificate);

        return ApiResponse::success(
            new CertificateResource($certificate),
            'Certificate retrieved successfully',
        );
    }
}
