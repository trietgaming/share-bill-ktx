declare const self: ServiceWorkerGlobalScope;

import { NotificationAction, NotificationData } from "@/types/notification";
import { MessagePayload } from "firebase/messaging";

// Extends the NotificationOptions to support limited features
interface ExtendedNotificationOptions extends NotificationOptions {
    actions?: NotificationAction[];
    renotify?: boolean;
}

export async function handleBackgroundMessage(payload: MessagePayload) {
    console.log('[firebase-messaging-sw] Received background message');

    if (!payload.notification) {
        console.log('[firebase-messaging-sw] No notification payload');
        return;
    }

    const notificationTitle = payload.notification?.title || 'Có cập nhật mới từ ShareBillKTX';

    const notificationData = payload.data as (NotificationData | undefined);

    const notificationOptions: ExtendedNotificationOptions = {
        body: payload.notification.body,
        icon: notificationData?.icon || '/favicon.ico',
        badge: notificationData?.badge,
        requireInteraction: notificationData?.requireInteraction === true,
        silent: notificationData?.silent === true,
        tag: notificationData?.tag,
        actions: notificationData?.actions,
        renotify: notificationData?.renotify,
        dir: notificationData?.dir,
        lang: notificationData?.lang,
    };

    try {
        await self.registration.showNotification(notificationTitle, notificationOptions);
    } catch (error) {
        console.error("[firebase-messaging-sw] Error showing notification", error);
    }
}