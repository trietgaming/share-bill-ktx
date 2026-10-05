"use client";

import { NotificationRecord, NotificationData, NotificationCursor } from "@/types/notification";
import type { MessagePayload } from "firebase/messaging";
import { createNotification } from "./notification-factory";
import Dexie, { EntityTable } from "dexie";

const notificationDb = new Dexie("NotificationDatabase") as Dexie & {
    notifications: EntityTable<
        NotificationRecord,
        "_id" // primary key "id" (for the typings only)
    >;
};

notificationDb.version(2).stores({
    notifications: "++_id, [userId+receivedAt], [userId+status+receivedAt]", // Primary key and indexed props
});

notificationDb.version(3).stores({
    notifications: "++_id, &[userId+messageId], [userId+receivedAt], [userId+receivedAt+_id], [userId+status+receivedAt]",
});

export async function storeNotification(payload: MessagePayload, userId: string) {
    if (!userId || payload.data?.persistent === "false" ||
        (payload.data?.recipientId && payload.data.recipientId !== userId)) return false;

    const [title, options, additionalData] = createNotification(payload);
    return notificationDb.transaction("rw", notificationDb.notifications, async () => {
        if (additionalData.messageId && await notificationDb.notifications
            .where("[userId+messageId]").equals([userId, additionalData.messageId]).first()) {
            return false;
        }
        await notificationDb.notifications.add({
            title, ...options, ...additionalData, userId,
        } as NotificationRecord);
        return true;
    });
}

export async function removeActionNotification(data: NotificationData) {
    if (!data.recipientId || !data.messageId) return;
    await notificationDb.notifications.where("[userId+messageId]")
        .equals([data.recipientId, data.messageId]).delete();
}

export async function getNotificationPage(userId: string, cursor: NotificationCursor | null = null) {
    const PAGE_SIZE = 20;
    if (!userId) return { items: [] as NotificationRecord[], nextCursor: null };
    const items = await notificationDb.notifications
        .where("[userId+receivedAt+_id]")
        .between(
            [userId, -Infinity, -Infinity],
            [userId, cursor?.receivedAt ?? Infinity, cursor?.id ?? Infinity],
            true, false
        ).reverse().limit(PAGE_SIZE).toArray();

    const lastItem = items[items.length - 1];
    return {
        items,
        nextCursor: items.length === PAGE_SIZE
            ? { receivedAt: lastItem.receivedAt, id: lastItem._id } : null,
    };
}

export { notificationDb };
