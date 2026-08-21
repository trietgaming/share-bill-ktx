import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/firebase/server";
import { Membership } from "@/models/Membership";
import { MonthPresence } from "@/models/MonthPresence";
import { MarkPresenceBody } from "@/types/actions";
import { NextResponse } from "next/server";
import { ensureDbConnection } from "@/lib/db-connect";
import { revalidateTag } from "next/cache";
import { PresenceStatus } from "@/enums/presence";

const markPresenceSchema = z.object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    day: z.number().int().min(0).max(30),
    status: z.union([
        z.literal(PresenceStatus.UNDETERMINED),
        z.literal(PresenceStatus.PRESENT),
        z.literal(PresenceStatus.ABSENT),
    ]),
    roomId: z.string().min(1),
});

export async function POST(request: Request) {
    await ensureDbConnection();
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    const parsedBody = markPresenceSchema.safeParse(await request.json());

    if (!parsedBody.success) {
        return NextResponse.json(
            { success: false, message: "Invalid request body" },
            { status: 400 }
        );
    }

    const body: MarkPresenceBody = parsedBody.data;

    const [year, monthNumber] = body.month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();

    if (body.day >= daysInMonth) {
        return NextResponse.json(
            { success: false, message: "Invalid request body" },
            { status: 400 }
        );
    }

    const membership = await Membership.findOne({
        user: user.uid,
        room: body.roomId,
    }).lean();

    if (!membership) {
        return NextResponse.json(
            { success: false, message: "Membership not found" },
            { status: 404 }
        );
    }

    let monthPresence = await MonthPresence.findOne({
        userId: user.uid,
        roomId: body.roomId,
        month: body.month,
    });

    if (!monthPresence) {
        // Must be fully sized up front: setting a single sparse index on
        // an empty array leaves `presence.length` at day+1, which fails
        // the schema's "one entry per day of month" validator for every
        // day except the last one.
        monthPresence = new MonthPresence({
            userId: user.uid,
            roomId: body.roomId,
            month: body.month,
            presence: Array(daysInMonth).fill(PresenceStatus.UNDETERMINED),
        });
    }
    monthPresence.presence[body.day] = body.status;

    try {
        await monthPresence.save();
        revalidateTag(`room-month-presence-${body.roomId}`);
        revalidateTag(`room-month-presence-${body.roomId}-${body.month}`);
    } catch (error) {
        console.error("Failed to save presence:", error);
        return NextResponse.json(
            { success: false, message: "Failed to save presence" },
            { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
}
