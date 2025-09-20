"use server";

import { ServerActionResponse } from "@/types/actions";
import { authenticate } from "@/lib/prechecks/auth";
import { getUserData } from "@/lib/user-data";
import {
    createSuccessResponse,
    handleDatabaseAction,
} from "@/lib/actions-helper";
import { MAX_FCM_TOKENS } from "@/models/UserData";

export async function subscribeToNotification(
    fcmToken: string
): ServerActionResponse<void> {
    const user = await authenticate();
    const userData = await getUserData(user);
    if (userData.fcmTokens.includes(fcmToken)) {
        return createSuccessResponse(void 0);
    }

    if (userData.fcmTokens.length >= MAX_FCM_TOKENS) {
        userData.fcmTokens.shift();
    }
    userData.fcmTokens.push(fcmToken);
    await handleDatabaseAction(userData.save());
    return createSuccessResponse(void 0);
}
