"use server";

import { z } from "zod";
import { RootFilterQuery } from "mongoose";
import { RoomActivity } from "@/models/RoomActivity";
import { IRoomActivity } from "@/types/room-activity";
import { RoomActivityType } from "@/enums/room-activity";
import { serializeDocument } from "@/lib/serializer";
import { serverAction } from "@/lib/actions-helper";
import { _authenticate } from "@/lib/prechecks/auth";
import { _verifyMembership, VerifyMembershipCtx } from "@/lib/prechecks/room";

export interface LogRoomActivityInput {
    roomId: string;
    actorId: string;
    type: RoomActivityType;
    payload?: Record<string, any>;
}

/**
 * Fire-and-forget append used internally by other server actions to record
 * room history. Deliberately not a public server action - callers pass
 * already-authorized data (roomId/actorId derived server-side). Failures are
 * swallowed so a logging hiccup never fails the action that triggered it.
 */
export async function logRoomActivity(data: LogRoomActivityInput) {
    try {
        await new RoomActivity(data).save();
    } catch (error) {
        console.error("Failed to log room activity:", error);
    }
}

interface GetRoomActivityQuery {
    cursor?: string | null;
}

const getRoomActivityQuerySchema = z
    .object({ cursor: z.string().nullable().optional() })
    .strict();

export const getRoomActivity = serverAction({
    fn: async function (
        _ctx: VerifyMembershipCtx,
        roomId: string,
        query: GetRoomActivityQuery = {}
    ): Promise<IRoomActivity[]> {
        const filter: RootFilterQuery<IRoomActivity> = { roomId };
        if (query.cursor) {
            filter._id = { $lt: query.cursor };
        }

        const activities = await RoomActivity.find(filter)
            .sort({ _id: -1 })
            .limit(20);

        return serializeDocument<IRoomActivity[]>(activities);
    },
    input: (roomId, query) => {
        z.string().min(1).parse(roomId);
        if (query !== undefined) getRoomActivityQuerySchema.parse(query);
    },
    initContext: (ctx, roomId) => {
        ctx.roomId = roomId;
    },
    prechecks: [_authenticate, _verifyMembership],
});
