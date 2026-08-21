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
): Promise<void> | undefined {
    if (!data) {
        console.error("Missing notification data for action:", action);
        return;
    }

    switch (action) {
        case NotificationClickAction.MARK_PRESENT:
        case NotificationClickAction.MARK_ABSENT:
            if (!isPresenceReminderData(data)) {
                console.error(
                    `Notification data of type "${data.type}" does not support action "${action}"`
                );
                return;
            }
            return markPresence(
                data,
                action === NotificationClickAction.MARK_PRESENT
                    ? PresenceStatus.PRESENT
                    : PresenceStatus.ABSENT,
                isForeground
            );
        default:
            console.error("Unknown notification action:", action);
    }
}
