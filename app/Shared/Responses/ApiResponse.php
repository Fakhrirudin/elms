<?php

namespace App\Shared\Responses;

use Illuminate\Http\JsonResponse;

/**
 * Builds JSON responses following the ELMS API envelope
 * documented in docs/architecture.md §11 (API Response Convention).
 */
class ApiResponse
{
    public static function success(mixed $data = null, string $message = 'Request successful', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    public static function error(string $message = 'Request failed', mixed $errors = null, int $status = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }
}
