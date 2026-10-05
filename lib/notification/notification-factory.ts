"use client";

import { NotificationType } from "@/enums/notification";
import { AdditionalNotificationData, ExtendedNotificationOptions, NotificationBlueprint, NotificationData } from "@/types/notification";
import { MessagePayload } from "firebase/messaging/sw";
import { createNewInvoiceNotification, createDeleteInvoiceNotification, createUpdateInvoiceNotification } from "./factories/invoice";
import { createPresenceReminderNotification } from "./factories/presence-reminder";
import { createMemberJoinedNotification, createMemberLeftNotification, createKickedFromRoomNotification, createRoomDeletedNotification } from "./factories/room-member";
import { createMonthPresenceFulfilledNotification, createPaymentReminderNotification } from "./factories/reminders";

export type NotificationFactory<D extends NotificationData> = (data: D) => NotificationBlueprint<D>;

const factoryMap: Record<NotificationType, NotificationFactory<any>> = {
    [NotificationType.NEW_INVOICE]: createNewInvoiceNotification,
    [NotificationType.DELETE_INVOICE]: createDeleteInvoiceNotification,
    [NotificationType.UPDATE_INVOICE]: createUpdateInvoiceNotification,
    [NotificationType.PRESENCE_REMINDER]: createPresenceReminderNotification,
    [NotificationType.MONTH_PRESENCE_FULFILLED]: createMonthPresenceFulfilledNotification,
    [NotificationType.PAYMENT_REMINDER]: createPaymentReminderNotification,
    [NotificationType.ROOM_MEMBER_JOINED]: createMemberJoinedNotification,
    [NotificationType.ROOM_MEMBER_LEFT]: createMemberLeftNotification,
    [NotificationType.KICKED_FROM_ROOM]: createKickedFromRoomNotification,
    [NotificationType.ROOM_DELETED]: createRoomDeletedNotification,
};

const fallbackNotificationOptions = {
    title: 'Có cập nhật mới từ ShareBillKTX',
    body: 'Mở ứng dụng để xem chi tiết.',
    icon: '/favicon.ico',
};

export function createNotification(messagePayload: MessagePayload):
    [title: string, options: ExtendedNotificationOptions & { data: NotificationData }, additionalData: AdditionalNotificationData] {

    const type = messagePayload.data?.type as NotificationType;
    const factory = Object.hasOwn(factoryMap, type) ? factoryMap[type] : undefined;
    const additionalData: AdditionalNotificationData = {
        status: "unread",
        receivedAt: Date.now(),
        messageId: messagePayload.data?.messageId || messagePayload.messageId,
    };

    const data = messagePayload.data as NotificationData || {};
    const blueprint = factory ? factory(data) : { ...fallbackNotificationOptions, data };
    const { title, ...options } = blueprint;
    return [
        messagePayload.notification?.title || data.title || title,
        {
            ...options,
            body: messagePayload.notification?.body || data.body || options.body,
            image: messagePayload.notification?.image || data.image || options.image,
            data,
        },
        additionalData,
    ];
}
