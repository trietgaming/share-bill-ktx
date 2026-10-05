declare const self: ServiceWorkerGlobalScope;

import { MessagePayload } from "firebase/messaging";
import { createNotification } from "@/lib/notification/notification-factory";
import { storeNotification } from "@/lib/notification/notification-db";

export async function handleBackgroundMessage(payload: MessagePayload) {
    console.log("[firebase-messaging-sw] Received background message");

    const [title, options] = createNotification(payload);

    const clients = await self.clients.matchAll({
        type: "window", includeUncontrolled: true,
    });

    try {
        let userId = payload.data?.recipientId;
        if (!userId) {
            // Compatibility with messages sent before recipientId was added.
            const response = await fetch("/api/auth");
            if (response.ok) userId = (await response.json()).uid;
        }
        // Persist even with no open tabs, before broadcasting to any pages.
        if (userId) await storeNotification(payload, userId);
    } catch (error) {
        console.error("[firebase-messaging-sw] Error storing notification", error);
    }

    clients.forEach((client) => client.postMessage({ type: "FCM_MESSAGE", payload }));
    const hasVisibleClient = clients.some((client) => client.visibilityState === "visible");
    // Older notification payloads are already displayed by the Firebase SDK.
    if (!payload.notification && !hasVisibleClient) {
        await self.registration.showNotification(title, options);
    }
}
