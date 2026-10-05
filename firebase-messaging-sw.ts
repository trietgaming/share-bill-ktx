/// <reference lib="webworker" />

/// @ts-ignore
const resources = self.__WB_MANIFEST; // this is just to satisfy workbox

declare const self: ServiceWorkerGlobalScope;

import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "@/lib/firebase/config";
import { handleBackgroundMessage } from "@/sw/handle-background-message";
import { handleNotificationClick } from "@/sw/handle-notification-click";

// Firebase's listener can stop propagation; our custom click handler must win.
self.addEventListener('notificationclick', handleNotificationClick);

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, handleBackgroundMessage);

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
