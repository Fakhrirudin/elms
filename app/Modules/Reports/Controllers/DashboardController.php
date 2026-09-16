<?php

namespace App\Modules\Reports\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reports\Resources\DashboardResource;
use App\Modules\Reports\Services\DashboardService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboardService) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewDashboard');

        $data = $this->dashboardService->getDashboard($request->user());

        return ApiResponse::success(
            new DashboardResource($data),
            'Dashboard retrieved successfully',
        );
    }
}
