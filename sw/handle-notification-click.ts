import { dispatchAction } from "@/lib/notification/action-dispatcher";
import { createNotification } from "@/lib/notification/notification-factory";
import { removeActionNotification } from "@/lib/notification/notification-db";
import { notificationTarget } from "@/lib/notification/notification-target";
import type { NotificationData } from "@/types/notification";

declare const self: ServiceWorkerGlobalScope;

async function openNotificationTarget(data?: NotificationData) {
    const url = new URL(notificationTarget(data), self.location.origin).href;
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const client = clients.find((item) => item.url === url) || clients[0];
    if (client) {
        if (client.url !== url) await client.navigate(url);
        await client.focus();
    } else {
        await self.clients.openWindow(url);
    }
}

export function handleNotificationClick(event: NotificationEvent) {
    // Register this handler before getMessaging() installs Firebase's handler.
    event.stopImmediatePropagation();
    event.notification.close();
    // Firebase's automatically displayed legacy notifications wrap their data.
    const data: NotificationData | undefined = event.notification.data?.FCM_MSG?.data
        || event.notification.data;

    event.waitUntil((async () => {
        if (!event.action) {
            await openNotificationTarget(data);
            return;
        }

        try {
            await dispatchAction(event.action, data);
        } catch (error) {
            console.error("[firebase-messaging-sw] Notification action failed:", error);
            const [title, options] = createNotification({ data } as Parameters<typeof createNotification>[0]);
            await self.registration.showNotification(title, {
                ...options,
                body: error instanceof Error ? error.message : "Không thể xử lý. Vui lòng thử lại.",
            });
            return;
        }

        // A successful server action stays successful even if local cleanup fails.
        try {
            if (data) await removeActionNotification(data);
        } catch (error) {
            console.error("[firebase-messaging-sw] Error removing notification:", error);
        }
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        clients.forEach((client) => client.postMessage({ type: "NOTIFICATION_ACTION_COMPLETED", data }));
    })());
}
