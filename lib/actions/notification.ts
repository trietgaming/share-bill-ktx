"use server";

import { authenticate } from "../prechecks/auth";
import { getUserData } from "../user-data";

export async function subscribeToNotification(fcmToken: string) {
    const user = await authenticate();
    const userData = await getUserData(user);
    if (userData.fcmTokens.includes(fcmToken)) {
        return;
    }

    userData.fcmTokens.push(fcmToken);
    await userData.save();
} 