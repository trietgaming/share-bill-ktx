import { dispatchAction } from "@/lib/notification/action-dispatcher";

declare const self: ServiceWorkerGlobalScope;

export function handleNotificationClick(event: NotificationEvent) {
    console.log('[firebase-messaging-sw] Notification click Received.', event);

    event.notification.close();

    if (event.action) {
        // Must keep the service worker alive until the async action finishes,
        // otherwise the browser may terminate it and abort the fetch.
        const actionResult = dispatchAction(
            event.action,
            event.notification.data
        );
        if (actionResult) {
            event.waitUntil(
                actionResult.catch((error) => {
                    console.error(
                        "[firebase-messaging-sw] Notification action failed:",
                        error
                    );
                })
            );
        }
    } else {
        event.waitUntil(
            self.clients
                .matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    for (const client of clientList) {
                        if ('focus' in client) {
                            return client.focus();
                        }
                    }
                    if (self.clients.openWindow) {
                        return self.clients.openWindow('/');
                    }
                })
        );
    }
}
