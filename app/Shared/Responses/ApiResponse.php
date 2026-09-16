<?php

namespace App\Shared\Responses;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
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

    /**
     * Build a paginated collection response with the `meta` envelope
     * documented in docs/api.md §6 (Pagination).
     *
     * @param  array<string, mixed>  $extraMeta
     */
    public static function paginated(mixed $data, LengthAwarePaginator $paginator, string $message = 'Request successful', array $extraMeta = []): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'meta' => array_merge([
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ], $extraMeta),
        ]);
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
