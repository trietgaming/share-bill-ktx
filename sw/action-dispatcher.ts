import { NotificationClickAction } from "@/enums/notification";
import { markPresent } from "./actions/mark-present";
import { markAbsent } from "./actions/mark-absent";
import { NotificationData } from "@/types/notification";

export function dispatchAction(action: string, data: NotificationData | any) {
    switch (action) {
        case NotificationClickAction.MARK_PRESENT:
            return markPresent(data);
        case NotificationClickAction.MARK_ABSENT:
            return markAbsent(data);
        default:
            console.log("Unknown action:", action);
    }
}
