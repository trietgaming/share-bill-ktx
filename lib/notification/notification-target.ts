import { NotificationType } from "@/enums/notification";
import type { NotificationData } from "@/types/notification";

export function notificationTarget(data?: NotificationData): string {
    if (!data?.roomId || data.type === NotificationType.ROOM_DELETED ||
        data.type === NotificationType.KICKED_FROM_ROOM) return "/";

    const roomPath = `/room/${encodeURIComponent(data.roomId)}`;
    switch (data.type) {
        case NotificationType.PRESENCE_REMINDER:
        case NotificationType.MONTH_PRESENCE_FULFILLED:
            return `${roomPath}/presence`;
        case NotificationType.NEW_INVOICE:
        case NotificationType.UPDATE_INVOICE:
        case NotificationType.DELETE_INVOICE:
        case NotificationType.PAYMENT_REMINDER:
            return `${roomPath}/invoices`;
        default:
            return `${roomPath}/dashboard`;
    }
}
