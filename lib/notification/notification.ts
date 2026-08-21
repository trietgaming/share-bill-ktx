"use client";

import { getToken } from "firebase/messaging";
import { firebaseMessaging } from "../firebase/client";
import { subscribeToNotification } from "../actions/notification";
import { handleAction } from "@/lib/action-handler";

export async function requestPermission() {
    if (Notification.permission === 'granted') {
        return true;
    }

    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Quá thời gian chờ cấp quyền')), 5000)
    );

    const permission = await Promise.race([
        Notification.requestPermission(),
        timeout,
    ]);

    return permission === 'granted';
}

async function registerServiceWorker() {
    let registration = await navigator.serviceWorker.getRegistration("/");
    if (registration) return registration;

    if ('serviceWorker' in navigator) {
        registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            {
                scope: "/",
            },
        );

        await navigator.serviceWorker.ready;
        return registration;
    } else {
        throw new Error('Service Workers are not supported in this browser.');
    }
}

export async function initializeNotification() {
    const isPermissionGranted = await requestPermission();

    if (!isPermissionGranted) {
        throw new Error('Không được cấp quyền thông báo.');
    }

    const registration = await registerServiceWorker();

    const firebaseToken = await getToken(firebaseMessaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
    });

    const cachedToken = localStorage.getItem('fcm_token');

    if (firebaseToken && firebaseToken !== cachedToken) {
        localStorage.setItem('fcm_token', firebaseToken);
        await handleAction(subscribeToNotification(firebaseToken))
    }
}