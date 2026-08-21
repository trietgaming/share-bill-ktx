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

const MAX_SEND_ATTEMPTS = 3;

export async function notifyUser<T extends NotificationData>(
    user: Pick<IUserData, "_id" | "fcmTokens">,
    sendOptions: NotificationSendOptions<T>
) {
    const messageBase = {
        notification: sendOptions.notification,
        data: sendOptions.data as unknown as { [key: string]: string },
        android: sendOptions.android,
        apns: sendOptions.apns,
        webpush: sendOptions.webpush,
        fcmOptions: sendOptions.fcmOptions,
    };

    let tokens = [...user.fcmTokens];

    for (
        let attempts = 0;
        tokens.length > 0 && attempts < MAX_SEND_ATTEMPTS;
        attempts++
    ) {
        // Exponential backoff before retrying
        if (attempts > 0) {
            await delay((1 << (attempts - 1)) * 1000);
        }

        const batchResponse = await getMessaging(adminApp).sendEachForMulticast(
            {
                ...messageBase,
                tokens,
            }
        );

        const invalidTokens: string[] = [];
        const retryableTokens: string[] = [];

        batchResponse.responses.forEach((response, index) => {
            if (response.success) return;

            const token = tokens[index];
            const error = response.error;

            if (
                error instanceof FirebaseMessagingError &&
                error.code.endsWith(
                    MessagingClientErrorCode
                        .REGISTRATION_TOKEN_NOT_REGISTERED.code
                )
            ) {
                invalidTokens.push(token);
                return;
            }

            if (attempts < MAX_SEND_ATTEMPTS - 1) {
                retryableTokens.push(token);
                return;
            }

            console.error(
                `Error sending notification to user ${user._id} with token ${token}:`,
                error
            );
        });

        if (invalidTokens.length > 0) {
            await UserData.findByIdAndUpdate(user._id, {
                $pull: { fcmTokens: { $in: invalidTokens } },
            });
        }

        tokens = retryableTokens;
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
        android: sendOptions.android,
        apns: sendOptions.apns,
        webpush: sendOptions.webpush,
        fcmOptions: sendOptions.fcmOptions,
    });
}
