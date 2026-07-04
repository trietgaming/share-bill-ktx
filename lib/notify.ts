import "server-only";
import {
    FirebaseMessagingError,
    getMessaging,
    MessagingClientErrorCode,
} from "firebase-admin/messaging";
import { adminApp } from "./firebase/admin";
import {
    NotificationData,
    NotificationSendOptions,
} from "@/types/notification";
import { IUserData } from "@/types/user-data";
import { UserData } from "@/models/UserData";
import { delay } from "./utils";

export async function notifyUser<T extends NotificationData>(
    user: Pick<IUserData, "_id" | "fcmTokens">,
    sendOptions: NotificationSendOptions<T>
) {
    await notify(
        user.fcmTokens,
        sendOptions,
        async (token, error, retry, attempts) => {
            if (error instanceof FirebaseMessagingError) {
                if (
                    error.code.endsWith(
                        MessagingClientErrorCode
                            .REGISTRATION_TOKEN_NOT_REGISTERED.code
                    )
                ) {
                    // Remove invalid token
                    await UserData.findByIdAndUpdate(user._id, {
                        $pull: { fcmTokens: token },
                    });

                    return;
                }
                // Exponential backoff retry. Awaited (not setTimeout) because
                // this whole chain must resolve before the caller - typically
                // a serverless function handler - returns; a fire-and-forget
                // setTimeout callback can be dropped once the instance freezes
                // after the response is sent.
                if (attempts < 3) {
                    await delay((1 << attempts) * 1000);
                    return retry();
                }
            }
            console.error(
                `Error sending notification to user ${user._id} with token ${token}:`,
                error
            );
        }
    );
}

export async function notify<T extends NotificationData>(
    tokens: string[],
    sendOptions: NotificationSendOptions<T>,
    onError?: (
        token: string,
        error: any,
        retry: () => Promise<any>,
        attempts: number
    ) => any
) {
    // Every token's send (and any retries) is awaited via Promise.all so the
    // caller can rely on `notify()` not resolving until delivery is actually
    // attempted end-to-end - previously each send was fired without being
    // awaited, so `notify()` returned almost immediately regardless of
    // whether the underlying FCM calls had completed.
    await Promise.all(
        tokens.map((token) => {
            const send = (attempts: number): Promise<any> =>
                getMessaging(adminApp)
                    .send({
                        token,
                        notification: sendOptions.notification,
                        data: sendOptions.data as unknown as {
                            [key: string]: string;
                        },
                        android: sendOptions.android,
                        apns: sendOptions.apns,
                        webpush: sendOptions.webpush,
                        fcmOptions: sendOptions.fcmOptions,
                    })
                    .catch((error) =>
                        onError
                            ? onError(
                                  token,
                                  error,
                                  () => send(attempts + 1),
                                  attempts + 1
                              )
                            : console.error(
                                  `Error sending notification to token ${token}:`,
                                  error
                              )
                    );

            return send(0);
        })
    );
}

export async function notifyTopic<T extends NotificationData = any>(
    topic: string,
    sendOptions: NotificationSendOptions<T>
) {
    await getMessaging(adminApp).send({
        topic,
        notification: sendOptions.notification,
        data: sendOptions.data as unknown as { [key: string]: string },
        android: sendOptions.android,
        apns: sendOptions.apns,
        webpush: sendOptions.webpush,
        fcmOptions: sendOptions.fcmOptions,
    });
}
