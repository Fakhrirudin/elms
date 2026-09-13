<?php

namespace App\Shared\Http\Middleware;

use App\Shared\Responses\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Reusable RBAC gate for future modules, e.g. `->middleware('role:SUPER_ADMIN,LEARNING_ADMIN')`.
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole(...$roles)) {
            return ApiResponse::error('You are not authorized to perform this action', null, 403);
        }

        return $next($request);
    }
}
