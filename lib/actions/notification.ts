"use server";

import { _authenticate, UserCtx } from "@/lib/prechecks/auth";
import { getUserData } from "@/lib/user-data";
import {
    serverAction,
} from "@/lib/actions-helper";
import { MAX_FCM_TOKENS } from "@/models/UserData";

export const subscribeToNotification = serverAction<(
    fcmToken: string
) => Promise<void>>({
    prechecks: [_authenticate],
    fn: async function
        (ctx: UserCtx,
            fcmToken: string
        ) {

        const userData = await getUserData(ctx.user);

        if (userData.fcmTokens.includes(fcmToken)) {
            return;
        }

        if (userData.fcmTokens.length >= MAX_FCM_TOKENS) {
            userData.fcmTokens.shift();
        }
        userData.fcmTokens.push(fcmToken);

        await userData.save();

        return (void 0);
    }

})