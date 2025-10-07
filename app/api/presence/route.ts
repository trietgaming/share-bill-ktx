import { isYYYYMM } from "@/lib/utils";
import { getAuthenticatedUser } from "@/lib/firebase/server";
import { Membership } from "@/models/Membership";
import { MonthPresence } from "@/models/MonthPresence";
import { MarkPresenceBody } from "@/types/actions";
import { NextResponse } from "next/server";
import { ensureDbConnection } from "@/lib/db-connect";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
    ensureDbConnection();
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    const body: MarkPresenceBody = await request.json();

    // Validate the request body
    if (
        !isYYYYMM(body.month) ||
        !Number.isInteger(body.day) ||
        body.day < 0 ||
        body.day > 31 ||
        !body.status ||
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
        });
    }
    monthPresence.presence[body.day] = body.status;

    try {
        await monthPresence.save();
        revalidateTag(`room-month-presence-${body.roomId}`);
    } catch {
        return NextResponse.json(
            { success: false, message: "Invalid request body" },
            { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
}
