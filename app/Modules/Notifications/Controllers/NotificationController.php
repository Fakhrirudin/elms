<?php

namespace App\Modules\Notifications\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Modules\Notifications\Requests\ListNotificationRequest;
use App\Modules\Notifications\Resources\NotificationResource;
use App\Modules\Notifications\Services\NotificationService;
use App\Shared\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    public function index(ListNotificationRequest $request): JsonResponse
    {
        $user = $request->user();
        $paginator = $this->notificationService->getUserNotifications($user, $request->validated());
        $unreadCount = $this->notificationService->getUnreadCount($user);

        return ApiResponse::paginated(
            NotificationResource::collection($paginator->items()),
            $paginator,
            'Notifications retrieved successfully',
            [
                'unread_count' => $unreadCount,
            ]
        );
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $unreadCount = $this->notificationService->getUnreadCount($request->user());

        return ApiResponse::success(
            ['unread_count' => $unreadCount],
            'Unread notification count retrieved successfully'
        );
    }

    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        $this->authorize('update', $notification);

        $updated = $this->notificationService->markAsRead($notification);

        return ApiResponse::success(
            new NotificationResource($updated),
            'Notification marked as read'
        );
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $count = $this->notificationService->markAllAsRead($request->user());

        return ApiResponse::success(
            ['updated_count' => $count],
            'All notifications marked as read'
        );
    }

    public function destroy(Request $request, Notification $notification): JsonResponse
    {
        $this->authorize('delete', $notification);

        $this->notificationService->deleteNotification($notification);

        return ApiResponse::success(
            null,
            'Notification deleted successfully'
        );
    }
}
