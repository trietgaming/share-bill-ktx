"use server";

import { authenticate } from "@/lib/prechecks/auth";
import { verifyMembership } from "../prechecks/room";
import { MonthPresence } from "@/models/MonthPresence";
import { isYYYYMM, parseYYYYMM } from "@/lib/utils";
import { serializeDocument } from "@/lib/serializer";
import { IMonthPresence } from "@/types/month-presence";
import { AppError } from "../errors";

export async function getRoomMonthPresence(roomId: string, month: string) {
    if (!isYYYYMM(month)) {
        throw new AppError("Invalid month format. Expected YYYY-MM");
    }
    const user = await authenticate();
    await verifyMembership(user.uid, roomId);

    const roomMonthPresences = await MonthPresence.find({ roomId, month });
    if (!roomMonthPresences.some(rmp => rmp.userId === user.uid)) {
        const { year, month: m } = parseYYYYMM(month)!;
        // Create default for caller
        const newPresence = await new MonthPresence({
            month,
            roomId,
            userId: user.uid,
            presence: Array(new Date(year, m, 0).getDate()).fill("undetermined"),
        }).save();

        return [serializeDocument<IMonthPresence>(newPresence)];
    }

    return serializeDocument<IMonthPresence[]>(roomMonthPresences);
}

export async function getRoomMonthsPresence(roomId: string, months: string[]) {
    if (months.length >= 12) {
        throw new AppError("Too many months requested. Maximum is 12.");
    }
    if (!months.every(isYYYYMM)) {
        throw new AppError("Invalid month format. Expected YYYY-MM");
    }
    const user = await authenticate();
    await verifyMembership(user.uid, roomId);

    const roomMonthPresences = await MonthPresence.find({ roomId, month: { $in: months } });

    return serializeDocument<IMonthPresence[]>(roomMonthPresences);
}

export interface UpdateMyMonthPresenceData {
    roomId: string;
    month: string; // Format: YYYY-MM
    presence: ("present" | "absent" | "undetermined")[];
}
export async function updateMyMonthPresence(data: UpdateMyMonthPresenceData) {
    const user = await authenticate();
    await verifyMembership(user.uid, data.roomId);

    const updateData: IMonthPresence = {
        "presence": data.presence,
        "month": data.month,
        "roomId": data.roomId,
        "userId": user.uid
    }
    await MonthPresence.validate(updateData);

    await MonthPresence.findOneAndUpdate(
        { roomId: data.roomId, userId: user.uid, month: data.month },
        updateData,
        { upsert: true, new: true, setDefaultsOnInsert: true });
}