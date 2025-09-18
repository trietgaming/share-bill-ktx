declare const self: ServiceWorkerGlobalScope;


export function handleNotificationClick(event: NotificationEvent) {
    console.log('[firebase-messaging-sw] Notification click Received.', event);

    event.notification.close();

    // event.waitUntil(
    //   self.clients.openWindow(window.location.href)
    // );
};
