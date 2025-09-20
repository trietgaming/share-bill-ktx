declare const self: ServiceWorkerGlobalScope;

import { MessagePayload } from "firebase/messaging";
import { createNotification } from "@/lib/notification/notification-factory";
import { notificationDb } from "@/lib/notification/notification-db";

export async function handleBackgroundMessage(payload: MessagePayload) {
    console.log("[firebase-messaging-sw] Received background message");

    const [title, options, additionalData] = createNotification(payload);

    try {
        const user: { uid: string } | null = await fetch("/auth").then((res) =>
            res.json()
        );

        if (user) {
            await notificationDb.notifications.add({
                title: title,
                ...options,
                ...additionalData,
                userId: user.uid,
            });
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
