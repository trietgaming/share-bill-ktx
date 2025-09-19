import { dispatchAction } from "./action-dispatcher";

declare const self: ServiceWorkerGlobalScope;

export function handleNotificationClick(event: NotificationEvent) {
    console.log('[firebase-messaging-sw] Notification click Received.', event);

    event.notification.close();

    if (event.action) {
        dispatchAction(event.action, event.notification.data);
    } else {
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
                for (const client of clientList) {
                    if ('focus' in client) {
                        return client.focus();
                    }
                }
                if (self.clients.openWindow) {
                    return self.clients.openWindow('/');
                }
            })
        )
    }
};
