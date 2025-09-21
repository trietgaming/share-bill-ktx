import { PresenceReminderNotificationData } from "@/types/notification";
import { NotificationFactory } from "../notification-factory";
import { NotificationClickAction } from "@/enums/notification";

export const createPresenceReminderNotification: NotificationFactory<
    PresenceReminderNotificationData
> = (data) => {
    return {
        title: `(P.${data.roomName}) Tích ngày ở hôm nay - ${+data.day + 1}/${
            data.month.split("-")[1]
        }`,
        body: "Chọn các hành động bên dưới để đánh dấu",
        // icon: '/icons/delete-invoice.png',
        data,
        actions: [
            { action: NotificationClickAction.MARK_PRESENT, title: "Có mặt" },
            { action: NotificationClickAction.MARK_ABSENT, title: "Vắng mặt" },
        ],
        requireInteraction: true,
    };
};
