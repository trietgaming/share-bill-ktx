"use server";

import { authenticate } from "@/lib/prechecks/auth";
import { verifyMembership } from "../prechecks/room";
import { MonthPresence } from "@/models/MonthPresence";
import { isYYYYMM, parseYYYYMM } from "@/lib/utils";
import { serializeDocument } from "@/lib/serializer";
import { IMonthPresence } from "@/types/month-presence";
import {
    createErrorResponse,
    createSuccessResponse,
    handleServerActionError,
} from "@/lib/actions-helper";
import { ErrorCode } from "@/enums/error";
import { ServerActionResponse } from "@/types/actions";
import { PresenceStatus } from "@/enums/presence";

export async function getRoomMonthPresence(
    roomId: string,
    month: string
): ServerActionResponse<IMonthPresence[]> {
    if (!isYYYYMM(month)) {
        return createErrorResponse(
            "Định dạng tháng không hợp lệ.",
            ErrorCode.INVALID_INPUT
        );
    }

    const user = await authenticate();

    const [_, err] = await verifyMembership(user.uid, roomId);
    if (err) return createErrorResponse(err);

    const roomMonthPresences = await MonthPresence.find({ roomId, month });

    if (!roomMonthPresences.some((rmp) => rmp.userId === user.uid)) {
        const { year, month: m } = parseYYYYMM(month)!;
        // Create default for caller
        try {
            const newPresence = await new MonthPresence({
                month,
                roomId,
                userId: user.uid,
                presence: Array(new Date(year, m, 0).getDate()).fill(
                    PresenceStatus.UNDETERMINED
                ),
            }).save();

            return createSuccessResponse([
                serializeDocument<IMonthPresence>(newPresence),
            ]);
        } catch (error) {
            return handleServerActionError(error);
        }
    }

    return createSuccessResponse(
        serializeDocument<IMonthPresence[]>(roomMonthPresences)
    );
}

export async function getRoomMonthsPresence(
    roomId: string,
    months: string[]
): ServerActionResponse<IMonthPresence[]> {
    if (months.length >= 12) {
        return createErrorResponse(
            "Không thể truy vấn quá 12 tháng một lần.",
            ErrorCode.INVALID_INPUT
        );
    }
    if (!months.every(isYYYYMM)) {
        return createErrorResponse(
            "Định dạng tháng không hợp lệ.",
            ErrorCode.INVALID_INPUT
        );
    }
    const user = await authenticate();

    const [_, err] = await verifyMembership(user.uid, roomId);
    if (err) return createErrorResponse(err);

    const roomMonthPresences = await MonthPresence.find({
        roomId,
        month: { $in: months },
    });

    return createSuccessResponse(
        serializeDocument<IMonthPresence[]>(roomMonthPresences)
    );
}

export interface UpdateMyMonthPresenceData {
    roomId: string;
    month: string; // Format: YYYY-MM
    presence: (
        | PresenceStatus.PRESENT
        | PresenceStatus.ABSENT
        | PresenceStatus.UNDETERMINED
    )[];
}
export async function updateMyMonthPresence(
    data: UpdateMyMonthPresenceData
): ServerActionResponse<void> {
    const user = await authenticate();

    const [, err] = await verifyMembership(user.uid, data.roomId);
    if (err) return createErrorResponse(err);

    const updateData: IMonthPresence = {
        presence: data.presence,
        month: data.month,
        roomId: data.roomId,
        userId: user.uid,
    };

    try {
        await MonthPresence.validate(updateData);

        await MonthPresence.findOneAndUpdate(
            { roomId: data.roomId, userId: user.uid, month: data.month },
            updateData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    } catch (error) {
        return handleServerActionError(error);
    }

    return createSuccessResponse(void 0);
}
