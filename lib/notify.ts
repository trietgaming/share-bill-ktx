import "server-only";
import { getMessaging } from "firebase-admin/messaging"
import { adminApp } from "./firebase/admin";
import { NotificationSendOptions } from "@/types/notification";

export async function notify(tokens: string[], sendOptions: NotificationSendOptions) {
    for (const token of tokens) {
        getMessaging(adminApp).send({
            token,
            notification: {
                title: sendOptions.title,
                body: sendOptions.body,
                imageUrl: sendOptions.imageUrl
            },
            data: sendOptions.data as { [key: string]: string },
        }).catch((error) => {
            console.error("Error sending notification to token", token, error);
        });
    }
}

export async function notifyTopic(topic: string, sendOptions: NotificationSendOptions) {
    await getMessaging(adminApp).send({
        topic,
        notification: {
            title: sendOptions.title,
            body: sendOptions.body,
            imageUrl: sendOptions.imageUrl
        },
        data: sendOptions.data as { [key: string]: string },
    })
}