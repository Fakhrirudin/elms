<?php

namespace App\Modules\Assessments\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Modules\Assessments\Requests\ReviewSubmissionRequest;
use App\Modules\Assessments\Requests\StoreSubmissionRequest;
use App\Modules\Assessments\Resources\AssignmentSubmissionResource;
use App\Modules\Assessments\Services\SubmissionService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AssignmentSubmissionController extends Controller
{
    public function __construct(
        private readonly SubmissionService $submissionService,
    ) {}

    public function store(StoreSubmissionRequest $request, Assignment $assignment): JsonResponse
    {
        $this->authorize('submit', $assignment);

        $submission = $this->submissionService->createSubmission(
            $assignment,
            $request->user(),
            $request->file('file'),
            $request->input('comment')
        );

        return ApiResponse::success(
            new AssignmentSubmissionResource($submission->load(['user', 'reviewer'])),
            'Assignment submitted successfully',
            201
        );
    }

    public function mySubmissions(Request $request, Assignment $assignment): JsonResponse
    {
        $this->authorize('submit', $assignment);

        $submissions = $this->submissionService->getUserSubmissions($assignment, $request->user());

        return ApiResponse::success(
            AssignmentSubmissionResource::collection($submissions),
            'Submissions retrieved successfully'
        );
    }

    public function index(Request $request, Assignment $assignment): JsonResponse
    {
        $this->authorize('viewAny', [AssignmentSubmission::class, $assignment]);

        $submissions = $this->submissionService->listSubmissionsForAssignment($assignment, $request->all());

        return ApiResponse::paginated(
            AssignmentSubmissionResource::collection($submissions),
            $submissions,
            'Assignment submissions retrieved successfully'
        );
    }

    public function show(AssignmentSubmission $submission): JsonResponse
    {
        $this->authorize('view', $submission);

        $submission->loadMissing(['user.department', 'reviewer', 'assignment.module.course']);

        return ApiResponse::success(
            new AssignmentSubmissionResource($submission),
            'Submission retrieved successfully'
        );
    }

    public function startReview(AssignmentSubmission $submission): JsonResponse
    {
        $this->authorize('startReview', $submission);

        $submission = $this->submissionService->startReview($submission, request()->user());

        return ApiResponse::success(
            new AssignmentSubmissionResource($submission->load(['user.department', 'reviewer'])),
            'Submission status updated to under review'
        );
    }

    public function review(ReviewSubmissionRequest $request, AssignmentSubmission $submission): JsonResponse
    {
        $this->authorize('review', $submission);

        $submission = $this->submissionService->reviewSubmission($submission, $request->user(), $request->validated());

        return ApiResponse::success(
            new AssignmentSubmissionResource($submission->load(['user.department', 'reviewer'])),
            'Submission evaluated successfully'
        );
    }

    public function download(AssignmentSubmission $submission): StreamedResponse
    {
        $this->authorize('download', $submission);

        return $this->submissionService->downloadSubmissionFile($submission);
    }
}
