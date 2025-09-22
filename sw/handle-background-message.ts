declare const self: ServiceWorkerGlobalScope;

import { MessagePayload } from "firebase/messaging";
import { createNotification } from "@/lib/notification/notification-factory";
import { notificationDb } from "@/lib/notification/notification-db";
import { NotificationRecord } from "@/types/notification";

export async function handleBackgroundMessage(payload: MessagePayload) {
    console.log("[firebase-messaging-sw] Received background message");

    const [title, options, additionalData] = createNotification(payload);

    try {
        const user: { uid: string } | null = await fetch("/api/auth").then(
            (res) => res.json()
        );

        if (user) {
            if (self.clients && self.clients.matchAll) {
                const clients = await self.clients.matchAll();
                clients.forEach((client) => {
                    client.postMessage({ type: "FCM_MESSAGE", payload });
                });
            } else {
                await notificationDb.notifications.add({
                    title: title,
                    ...options,
                    ...additionalData,
                    userId: user.uid,
                } as NotificationRecord);
            }
        }

        // If the message contains a notification payload, Firebase SDK would automatically display it.
        if (!payload.notification)
            await self.registration.showNotification(title, options);
    } catch (error) {
        console.error(
            "[firebase-messaging-sw] Error showing notification",
            error
        );
    }
}
