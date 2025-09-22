import { NotificationClickAction } from "@/enums/notification";
import { markPresent } from "./actions/mark-present";
import { markAbsent } from "./actions/mark-absent";
import { NotificationData } from "@/types/notification";

export function dispatchAction(action: string, data: NotificationData | any, isForeground = false) {
    switch (action) {
        case NotificationClickAction.MARK_PRESENT:
            return markPresent(data, isForeground);
        case NotificationClickAction.MARK_ABSENT:
            return markAbsent(data, isForeground);
        default:
            console.log("Unknown action:", action);
    }
}
