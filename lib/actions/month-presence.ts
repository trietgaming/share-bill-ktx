"use server";

import { _authenticate, UserCtx } from "@/lib/prechecks/auth";
import { _verifyMembership, verifyMembership, VerifyMembershipCtx } from "../prechecks/room";
import { MonthPresence } from "@/models/MonthPresence";
import { isYYYYMM, parseYYYYMM } from "@/lib/utils";
import { serializeDocument } from "@/lib/serializer";
import { IMonthPresence } from "@/types/month-presence";
import {
    createErrorResponse,
    serverAction,
} from "@/lib/actions-helper";
import { ErrorCode } from "@/enums/error";
import { PresenceStatus } from "@/enums/presence";
import { AppError } from "../errors";
import { revalidateTag } from "next/cache";

export const getRoomMonthPresence = serverAction<
    (
        roomId: string,
        month: string
    ) => Promise<IMonthPresence[]>
>(
    {
        initContext(ctx, roomId, month) {
            ctx.roomId = roomId;
            ctx.month = month
        },
        prechecks: [async (ctx: { month: string }) => {
            if (!isYYYYMM(ctx.month)) {
                return createErrorResponse(
                    "Định dạng tháng không hợp lệ.",
                    ErrorCode.INVALID_INPUT
                );
            }
        },
            _authenticate,
            _verifyMembership],
        fn: async function (
            ctx: UserCtx & VerifyMembershipCtx,
            roomId,
            month
        ) {
            const user = ctx.user

            const roomMonthPresences = await MonthPresence.find({ roomId, month });

            if (!roomMonthPresences.some((rmp) => rmp.userId === user.uid)) {
                const { year, month: m } = parseYYYYMM(month)!;
                // Create default for caller

                const newPresence = await new MonthPresence({
                    month,
                    roomId,
                    userId: user.uid,
                    presence: Array(new Date(year, m, 0).getDate()).fill(
                        PresenceStatus.UNDETERMINED
                    ),
                }).save();

                return [
                    serializeDocument<IMonthPresence>(newPresence),
                ];

            }

            return serializeDocument<IMonthPresence[]>(roomMonthPresences)

        },
        cache: (ctx, roomId, month) => {
            return {
                tags: [`room-month-presence-${roomId}-${month}`,`room-month-presence-${roomId}`, `room-${roomId}`],
            };
        }
    }
)

export const getRoomMonthsPresence = serverAction<
    (
        roomId: string,
        months: string[]
    ) => Promise<IMonthPresence[]>>(
        {
            initContext: (ctx, roomId, months) => {
                ctx.roomId = roomId;
            },
            prechecks: [
                async (ctx, roomId, months) => {
                    if (months.length >= 12) {
                        throw new AppError(
                            "Không thể truy vấn quá 12 tháng một lần.",
                            ErrorCode.INVALID_INPUT
                        );
                    }
                    if (!months.every(isYYYYMM)) {
                        throw new AppError(
                            "Định dạng tháng không hợp lệ.",
                            ErrorCode.INVALID_INPUT
                        );
                    }
                },
                _authenticate,
                _verifyMembership
            ],
            fn: async function (
                ctx,
                roomId: string,
                months: string[]
            ) {
                const roomMonthPresences = await MonthPresence.find({
                    roomId,
                    month: { $in: months },
                });

                return serializeDocument<IMonthPresence[]>(roomMonthPresences)
            },
            cache: (ctx, roomId) => {
                return {
                    tags: [`room-month-presence-${roomId}`, `room-${roomId}`],
                };
            }
        }
    )

export interface UpdateMyMonthPresenceData {
    roomId: string;
    month: string; // Format: YYYY-MM
    presence: (
        | PresenceStatus.PRESENT
        | PresenceStatus.ABSENT
        | PresenceStatus.UNDETERMINED
    )[];
}
export const updateMyMonthPresence = serverAction<
    (data: UpdateMyMonthPresenceData) => Promise<void>
>(
    {
        initContext: (ctx, data) => {
            ctx.roomId = data.roomId;
        },
        prechecks: [
            _authenticate,
            _verifyMembership
        ],
        fn: async function (ctx,
            data
        ) {
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
        }
    }
)
