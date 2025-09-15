"use server";

import { authenticate } from "@/lib/prechecks/auth";
import { verifyMembership } from "../prechecks/room";
import { MonthAttendance } from "@/models/MonthAttendance";
import { isYYYYMM, parseYYYYMM } from "@/lib/utils";
import { serializeDocument } from "@/lib/serializer";
import { IMonthAttendance } from "@/types/MonthAttendance";
import { AppError } from "../errors";

export async function getRoomMonthAttendance(roomId: string, month: string) {
    if (!isYYYYMM(month)) {
        throw new AppError("Invalid month format. Expected YYYY-MM");
    }
    const user = await authenticate();
    await verifyMembership(user.uid, roomId);

    const roomMonthAttendances = await MonthAttendance.find({ roomId, month });
    if (roomMonthAttendances.length === 0) {
        const { year, month: m } = parseYYYYMM(month)!;
        // Create default for caller
        const newAttendance = await new MonthAttendance({
            month,
            roomId,
            userId: user.uid,
            attendance: Array(new Date(year, m, 0).getDate()).fill("undetermined"),
        }).save();

        return [serializeDocument<IMonthAttendance>(newAttendance)];
    }

    return serializeDocument<IMonthAttendance[]>(roomMonthAttendances);
}

export async function getRoomMonthsAttendance(roomId: string, months: string[]) {
    if (months.length >= 12) {
        throw new AppError("Too many months requested. Maximum is 12.");
    }
    if (!months.every(isYYYYMM)) {
        throw new AppError("Invalid month format. Expected YYYY-MM");
    }
    const user = await authenticate();
    await verifyMembership(user.uid, roomId);

    const roomMonthAttendances = await MonthAttendance.find({ roomId, month: { $in: months } });

    return serializeDocument<IMonthAttendance[]>(roomMonthAttendances);
}

export interface UpdateMyMonthAttendanceData {
    roomId: string;
    month: string; // Format: YYYY-MM
    attendance: ("present" | "absent" | "undetermined")[];
}
export async function updateMyMonthAttendance(data: UpdateMyMonthAttendanceData) {
    const user = await authenticate();
    await verifyMembership(user.uid, data.roomId);

    const updateData: IMonthAttendance = {
        "attendance": data.attendance,
        "month": data.month,
        "roomId": data.roomId,
        "userId": user.uid
    }
    await MonthAttendance.validate(updateData);

    await MonthAttendance.findOneAndUpdate(
        { roomId: data.roomId, userId: user.uid, month: data.month },
        updateData,
        { upsert: true, new: true, setDefaultsOnInsert: true });
}