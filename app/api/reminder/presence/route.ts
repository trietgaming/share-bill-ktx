import { remindRoomsPresence } from "@/lib/messages/remind-room-presence";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    console.log("Presence reminder triggered");
    const authHeader = req.headers.get("Authorization");
    const secret = process.env.CRON_SECRET;
    if (!authHeader || !secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ success: false }, { status: 401 });
    }

    remindRoomsPresence();

    return NextResponse.json({ success: true });
}
