"use server";

import { z } from "zod";
import { _authenticate, UserCtx } from "@/lib/prechecks/auth";
import {
    _verifyMembership,
    verifyMembership,
    VerifyMembershipCtx,
} from "../prechecks/room";
import { MonthPresence } from "@/models/MonthPresence";
import { isYYYYMM, parseYYYYMM } from "@/lib/utils";
import { serializeDocument } from "@/lib/serializer";
import { IMonthPresence } from "@/types/month-presence";
import { createErrorResponse, serverAction } from "@/lib/actions-helper";
import { ErrorCode } from "@/enums/error";
import { PresenceStatus } from "@/enums/presence";
import { AppError } from "../errors";
import { revalidateTag } from "next/cache";

const yyyyMmSchema = z
    .string()
    .refine(isYYYYMM, { message: "Định dạng tháng không hợp lệ." });

export const getRoomMonthPresence = serverAction({
    fn: async function (
        _ctx: VerifyMembershipCtx,
        roomId: string,
        month: string
    ): Promise<IMonthPresence[]> {
        // Reads only - see the `ensureCallerHasMonthPresence` precheck below
        // for why this function must stay a pure read (results are cached
        // across every member of the room+month, not just the caller).
        const roomMonthPresences = await MonthPresence.find({ roomId, month });

        return serializeDocument<IMonthPresence[]>(roomMonthPresences);
    },
    input: (roomId, month) => {
        z.string().min(1).parse(roomId);
        yyyyMmSchema.parse(month);
    },
    initContext(ctx, roomId) {
        ctx.roomId = roomId;
    },
    prechecks: [
        _authenticate,
        _verifyMembership,
        // Ensure the caller has a presence doc for this room+month, creating
        // one if missing. This used to happen inside the cached `fn` above,
        // which meant: (a) it only ever ran on a cold cache, so a second
        // member hitting a warm cache never got their default doc created,
        // and (b) the cached response was whatever the *first* caller's
        // branch produced (sometimes just `[newDoc]` instead of the room's
        // full presence list). Running it as a precheck means it executes on
        // every call regardless of cache state, and the revalidateTag right
        // after keeps the cache correct for whoever reads next.
        async function ensureCallerHasMonthPresence(
            ctx: VerifyMembershipCtx,
            roomId: string,
            month: string
        ) {
            const alreadyExists = await MonthPresence.exists({
                roomId,
                userId: ctx.user.uid,
                month,
            });
            if (alreadyExists) return;

            const { year, month: m } = parseYYYYMM(month)!;
            await new MonthPresence({
                month,
                roomId,
                userId: ctx.user.uid,
                presence: Array(new Date(year, m, 0).getDate()).fill(
                    PresenceStatus.UNDETERMINED
                ),
            }).save();

            revalidateTag(`room-month-presence-${roomId}-${month}`);
        },
    ],
    cache: (ctx, roomId, month) => {
        return {
            tags: [
                `room-month-presence-${roomId}-${month}`,
                `room-month-presence-${roomId}`,
                `room-${roomId}`,
            ],
        };
    },
});

export const getRoomMonthsPresence = serverAction({
    fn: async function (
        ctx: VerifyMembershipCtx,
        roomId: string,
        months: string[]
    ): Promise<IMonthPresence[]> {
        const roomMonthPresences = await MonthPresence.find({
            roomId,
            month: { $in: months },
        });

        return serializeDocument<IMonthPresence[]>(roomMonthPresences);
    },
    input: (roomId, months) => {
        z.string().min(1).parse(roomId);
        z.array(yyyyMmSchema)
            .max(12, "Không thể truy vấn quá 12 tháng một lần.")
            .parse(months);
    },
    initContext: (ctx, roomId, months) => {
        ctx.roomId = roomId;
    },
    prechecks: [_authenticate, _verifyMembership],
    cache: (ctx, roomId) => {
        return {
            tags: [`room-month-presence-${roomId}`, `room-${roomId}`],
        };
    },
});

export interface UpdateMyMonthPresenceData {
    roomId: string;
    month: string; // Format: YYYY-MM
    presence: (
        | PresenceStatus.PRESENT
        | PresenceStatus.ABSENT
        | PresenceStatus.UNDETERMINED
    )[];
}

const updateMyMonthPresenceInputSchema = z
    .object({
        roomId: z.string().min(1),
        month: yyyyMmSchema,
        presence: z.array(
            z.union([
                z.literal(PresenceStatus.PRESENT),
                z.literal(PresenceStatus.ABSENT),
                z.literal(PresenceStatus.UNDETERMINED),
            ])
        ),
    })
    .strict();

export const updateMyMonthPresence = serverAction({
    fn: async function (ctx: VerifyMembershipCtx, data: UpdateMyMonthPresenceData): Promise<void> {
        const updateData: IMonthPresence = {
            presence: data.presence,
            month: data.month,
            roomId: data.roomId,
            userId: ctx.user.uid,
        };

        await MonthPresence.validate(updateData);

        await MonthPresence.findOneAndUpdate(
            { roomId: data.roomId, userId: ctx.user.uid, month: data.month },
            updateData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        revalidateTag(`room-month-presence-${data.roomId}`);
    },
    input: (data) => updateMyMonthPresenceInputSchema.parse(data),
    initContext: (ctx, data) => {
        ctx.roomId = data.roomId;
    },
    prechecks: [_authenticate, _verifyMembership],
});
