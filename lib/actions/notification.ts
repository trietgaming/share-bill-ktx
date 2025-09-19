"use server";

import { ServerActionResponse } from "@/types/actions";
import { authenticate } from "../prechecks/auth";
import { getUserData } from "../user-data";
import { createSuccessResponse } from "@/lib/actions-helper";

export async function subscribeToNotification(fcmToken: string): ServerActionResponse<void> {
    const user = await authenticate();
    const userData = await getUserData(user);
    if (userData.fcmTokens.includes(fcmToken)) {
        return createSuccessResponse(void 0);
    }

    userData.fcmTokens.push(fcmToken);
    await userData.save();
    return createSuccessResponse(void 0);
} 