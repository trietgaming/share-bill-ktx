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
                // Exponential backoff retry
                if (attempts < 3) {
                    setTimeout(retry, (1 << attempts) * 1000, attempts + 1);
                    return;
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
    for (const token of tokens) {
        const retry = (attempts: number = 0) =>
            getMessaging(adminApp)
                .send({
                    token,
                    notification: sendOptions.notification,
                    data: sendOptions.data as unknown as {
                        [key: string]: string;
                    },
                })
                .catch((error) =>
                    onError
                        ? onError(token, error, retry, attempts + 1)
                        : console.error(
                              `Error sending notification to token ${token}:`,
                              error
                          )
                );
        retry();
    }
}

export async function notifyTopic<T extends NotificationData = any>(
    topic: string,
    sendOptions: NotificationSendOptions<T>
) {
    await getMessaging(adminApp).send({
        topic,
        notification: sendOptions.notification,
        data: sendOptions.data as unknown as { [key: string]: string },
    });
}
