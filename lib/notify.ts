import "server-only";
import { getMessaging } from "firebase-admin/messaging"
import { adminApp } from "./firebase/admin";
import { NotificationData, NotificationSendOptions } from "@/types/notification";

export async function notify<T extends NotificationData>(tokens: string[], sendOptions: NotificationSendOptions<T>) {
    for (const token of tokens) {
        getMessaging(adminApp).send({
            token,
            notification: sendOptions.notification,
            data: sendOptions.data as unknown as { [key: string]: string },
        }).catch((error) => {
            console.error("Error sending notification to token", token, error);
        });
    }
}

export async function notifyTopic<T extends NotificationData = any>(topic: string, sendOptions: NotificationSendOptions<T>) {
    await getMessaging(adminApp).send({
        topic,
        notification: sendOptions.notification,
        data: sendOptions.data as unknown as { [key: string]: string },
    })
}