import { NotificationType } from "@/enums/notification";
import {
    NewInvoiceNotificationData,
    NotificationData,
} from "@/types/notification";
import { MessagePayload } from "firebase/messaging";
import { handleInvoicesChange } from "./foreground-handlers/invoices-change";
import { handleRoomMemberChange } from "./foreground-handlers/room-member-change";

export type ForegroundMessageHandler<D extends NotificationData> = (
    data: D
) => void;

const foregroundMessageHandlers: Partial<
    Record<NotificationType, ForegroundMessageHandler<any>>
> = {
    [NotificationType.NEW_INVOICE]: handleInvoicesChange,
    [NotificationType.DELETE_INVOICE]: handleInvoicesChange,
    [NotificationType.UPDATE_INVOICE]: handleInvoicesChange,

    [NotificationType.ROOM_MEMBER_LEFT]: handleRoomMemberChange,
    [NotificationType.ROOM_MEMBER_JOINED]: handleRoomMemberChange,
};

export const handleForegroundMessage = (payload: MessagePayload) => {
    console.log("[firebase-messaging] Received foreground message", payload);
    const type = payload.data?.type as NotificationType;

    const handler = foregroundMessageHandlers[type];
    if (handler) {
        handler(payload.data as NotificationData);
    } else {
        console.warn(`No handler for notification type: ${type}`);
    }
};
