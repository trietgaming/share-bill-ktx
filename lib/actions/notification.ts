"use server";

import { _authenticate, UserCtx } from "@/lib/prechecks/auth";
import { getUserData } from "@/lib/user-data";
import { serverAction } from "@/lib/actions-helper";
import { MAX_FCM_TOKENS, UserData } from "@/models/UserData";
import { z } from "zod";

export const subscribeToNotification = serverAction({
    fn: async function (ctx: UserCtx, fcmToken: string): Promise<void> {
        // A browser token belongs to its currently authenticated account.
        await UserData.updateMany(
            { _id: { $ne: ctx.user.uid }, fcmTokens: fcmToken },
            { $pull: { fcmTokens: fcmToken } }
        );
        await getUserData(ctx.user);
        // The predicate and bounded push are atomic: simultaneous device
        // registrations must not overwrite each other's tokens.
        await UserData.updateOne(
            { _id: ctx.user.uid, fcmTokens: { $ne: fcmToken } },
            { $push: { fcmTokens: { $each: [fcmToken], $slice: -MAX_FCM_TOKENS } } }
        );

        return void 0;
    },
    input: (fcmToken) => { z.string().min(1).parse(fcmToken); },
    prechecks: [_authenticate],
});
