import { isYYYYMM, parseYYYYMM } from "@/lib/utils";
import { getAuthenticatedUser } from "@/lib/firebase/server";
import { Membership } from "@/models/Membership";
import { MonthPresence } from "@/models/MonthPresence";
import { MarkPresenceBody } from "@/types/actions";
import { NextResponse } from "next/server";
import { ensureDbConnection } from "@/lib/db-connect";
import { revalidateTag } from "next/cache";
import { PresenceStatus } from "@/enums/presence";

// PresenceStatus is a const enum - it has no runtime object to iterate over
// with Object.values(), so its members are listed out explicitly here.
const VALID_STATUSES: number[] = [
    PresenceStatus.UNDETERMINED,
    PresenceStatus.PRESENT,
    PresenceStatus.ABSENT,
];

export async function POST(request: Request) {
    await ensureDbConnection();
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    const body: MarkPresenceBody = await request.json();

    const parsedMonth = isYYYYMM(body.month) ? parseYYYYMM(body.month) : null;
    const daysInMonth = parsedMonth
        ? new Date(parsedMonth.year, parsedMonth.month, 0).getDate()
        : 0;

    // Validate the request body
    if (
        !parsedMonth ||
        !Number.isInteger(body.day) ||
        body.day < 0 ||
        body.day >= daysInMonth ||
        !VALID_STATUSES.includes(body.status) ||
        !body.roomId
    ) {
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
        monthPresence = new MonthPresence({
            userId: user.uid,
            roomId: body.roomId,
            month: body.month,
            // Must be fully sized up front: setting a single sparse index on
            // an empty array leaves `presence.length` at day+1, which fails
            // the schema's "one entry per day of month" validator for every
            // day except the last one.
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
            { success: false, message: "Invalid request body" },
            { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
}
