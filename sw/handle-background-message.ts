declare const self: ServiceWorkerGlobalScope;

import { MessagePayload } from "firebase/messaging";
import { createNotification } from "@/lib/notification/notification-factory";
import { notificationDb } from "@/lib/notification/notification-db";
import { NotificationRecord } from "@/types/notification";

export async function handleBackgroundMessage(payload: MessagePayload) {
    console.log("[firebase-messaging-sw] Received background message");

    const [title, options, additionalData] = createNotification(payload);

    try {
        const authResponse = await fetch("/api/auth");
        const user: { uid?: string } | null = authResponse.ok
            ? await authResponse.json()
            : null;

        let hasVisibleClient = false;

        if (user?.uid) {
            if (self.clients && self.clients.matchAll) {
                const clients = await self.clients.matchAll({
                    type: "window",
                    includeUncontrolled: true,
                });
                hasVisibleClient = clients.some(
                    (client) => client.visibilityState === "visible"
                );
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
        // Skip when a tab is already visible since the page displays the message itself.
        if (!payload.notification && !hasVisibleClient)
            await self.registration.showNotification(title, options);
    } catch (error) {
        console.error(
            "[firebase-messaging-sw] Error showing notification",
            error
        );
    }
}
