import { NotificationType } from "@/enums/notification";
import { NotificationData } from "@/types/notification";
import { MessagePayload } from "firebase/messaging";
import { handleInvoicesChange } from "./foreground-handlers/invoices-change";
import { handleRoomMemberChange } from "./foreground-handlers/room-member-change";
import { presenceQueryKey, queryClient } from "@/lib/query-client";

export type ForegroundMessageHandler<D extends NotificationData> = (
    data: D
) => void | Promise<void>;

const foregroundMessageHandlers: Record<NotificationType, ForegroundMessageHandler<any>> = {
    [NotificationType.NEW_INVOICE]: handleInvoicesChange,
    [NotificationType.DELETE_INVOICE]: handleInvoicesChange,
    [NotificationType.UPDATE_INVOICE]: handleInvoicesChange,

    [NotificationType.ROOM_MEMBER_LEFT]: handleRoomMemberChange,
    [NotificationType.ROOM_MEMBER_JOINED]: handleRoomMemberChange,
    [NotificationType.KICKED_FROM_ROOM]: handleRoomMemberChange,
    [NotificationType.ROOM_DELETED]: handleRoomMemberChange,
    [NotificationType.PAYMENT_REMINDER]: handleInvoicesChange,
    // A reminder does not mutate presence. Its buttons do that separately.
    [NotificationType.PRESENCE_REMINDER]: () => {},
    [NotificationType.MONTH_PRESENCE_FULFILLED]: async (data) => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: presenceQueryKey(data.roomId) }),
            handleInvoicesChange(data),
        ]);
    },
};

export const handleForegroundMessage = async (payload: MessagePayload) => {
    console.log("[firebase-messaging] Received foreground message", payload);
    const type = payload.data?.type as NotificationType;

    const handler = Object.hasOwn(foregroundMessageHandlers, type)
        ? foregroundMessageHandlers[type] : undefined;
    if (handler) {
        await handler(payload.data as NotificationData);
    } else {
        console.warn(`No handler for notification type: ${type}`);
    }
};
