<?php

namespace App\Shared\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    /**
     * Report that the API is reachable and routing is configured correctly.
     */
    public function __invoke(): JsonResponse
    {
        return ApiResponse::success([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ], 'API is healthy');
    }
}
