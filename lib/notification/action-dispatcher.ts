import {
    NotificationClickAction,
    NotificationType,
} from "@/enums/notification";
import { PresenceStatus } from "@/enums/presence";
import { markPresence } from "./actions/mark-presence";
import {
    NotificationData,
    PresenceReminderNotificationData,
} from "@/types/notification";

function isPresenceReminderData(
    data: NotificationData
): data is PresenceReminderNotificationData {
    return data.type === NotificationType.PRESENCE_REMINDER;
}

export function dispatchAction(
    action: string,
    data: NotificationData | undefined,
    isForeground = false
): Promise<void> {
    if (!data) {
        return Promise.reject(new Error("Thông báo thiếu dữ liệu để xử lý."));
    }

    switch (action) {
        case NotificationClickAction.MARK_PRESENT:
        case NotificationClickAction.MARK_ABSENT:
            if (!isPresenceReminderData(data)) {
                return Promise.reject(new Error("Hành động không phù hợp với loại thông báo này."));
            }
            return markPresence(
                data,
                action === NotificationClickAction.MARK_PRESENT
                    ? PresenceStatus.PRESENT
                    : PresenceStatus.ABSENT,
                isForeground
            );
        default:
            return Promise.reject(new Error("Hành động thông báo chưa được hỗ trợ."));
    }
}
