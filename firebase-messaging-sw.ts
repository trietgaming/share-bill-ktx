/// <reference lib="webworker" />

// const resources = self.__WB_MANIFEST; // this is just to satisfy workbox

declare const self: ServiceWorkerGlobalScope;

import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "@/lib/firebase/config";
import { handleBackgroundMessage } from "@/sw/handle-background-message";
import { handleNotificationClick } from "@/sw/handle-notification-click";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, handleBackgroundMessage);

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// self.addEventListener('activate', (event) => {
//   console.log('Service worker activating...');
// });

self.addEventListener('notificationclick', handleNotificationClick)

// self.addEventListener('fetch', (event) => {  
// });          