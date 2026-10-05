"use client";

import { getToken } from "firebase/messaging";
import { firebaseMessaging } from "../firebase/client";
import { subscribeToNotification } from "../actions/notification";
import { handleAction } from "@/lib/action-handler";

export async function requestPermission() {
    if (!("Notification" in window)) {
        throw new Error("Trình duyệt không hỗ trợ thông báo.");
    }
    if (Notification.permission === 'granted') {
        return true;
    }

    const permission = await Notification.requestPermission();

    return permission === 'granted';
}

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        // register() also checks for an update to an existing worker.
        const registration = await navigator.serviceWorker.register(
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

    if (!firebaseToken) throw new Error("Không thể lấy mã đăng ký thông báo. Vui lòng thử lại.");
    // Reconcile with the server on each initialization. A cached browser
    // token may have been evicted or reassigned after changing accounts.
    await handleAction(subscribeToNotification(firebaseToken));
}
