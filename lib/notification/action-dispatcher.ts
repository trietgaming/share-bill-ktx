import { NotificationClickAction } from "@/enums/notification";
import { PresenceStatus } from "@/enums/presence";
import { markPresence } from "./actions/mark-presence";
import { PresenceReminderNotificationData } from "@/types/notification";

export function dispatchAction(
    action: string,
    data: PresenceReminderNotificationData | undefined,
    isForeground = false
): Promise<void> | undefined {
    if (!data) {
        console.error("Missing notification data for action:", action);
        return;
    }

    switch (action) {
        case NotificationClickAction.MARK_PRESENT:
            return markPresence(data, PresenceStatus.PRESENT, isForeground);
        case NotificationClickAction.MARK_ABSENT:
            return markPresence(data, PresenceStatus.ABSENT, isForeground);
        default:
            console.error("Unknown notification action:", action);
    }
}
