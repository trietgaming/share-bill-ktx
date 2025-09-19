"use client";

import { NotificationType } from "@/enums/notification";
import { AdditionalNotificationData, NotificationBlueprint, NotificationData } from "@/types/notification";
import { MessagePayload } from "firebase/messaging/sw";
import { createNewInvoiceNotification } from "./factories/new-invoice";
import { createDeleteInvoiceNotification } from "./factories/delete-invoice";

export type NotificationFactory<D extends NotificationData> = (data: D) => NotificationBlueprint<D>;

const factoryMap: Record<NotificationType, NotificationFactory<NotificationData>> = {
    [NotificationType.NEW_INVOICE]: createNewInvoiceNotification,
    [NotificationType.DELETE_INVOICE]: createDeleteInvoiceNotification,
};

const fallbackNotificationOptions = {
    title: 'Có cập nhật mới từ ShareBillKTX',
    body: 'Mở ứng dụng để xem chi tiết.',
    icon: '/favicon.ico',
};

export function createNotification(messagePayload: MessagePayload):
    [title: string, options: NotificationOptions, additionalData: AdditionalNotificationData] {

    const type = messagePayload.data?.type as NotificationType;
    const factory = factoryMap[type];
    const additionalData: AdditionalNotificationData = {
        status: "unread",
        receivedAt: Date.now(),
    };

    if (!factory) {
        return [
            messagePayload.notification?.title || fallbackNotificationOptions.title,
            messagePayload.notification || fallbackNotificationOptions,
            additionalData
        ];
    }

    const { title, ...options } = factory(messagePayload.data as NotificationData);
    return [title, options, additionalData];
}