import { remindRoomsPresence } from "@/lib/messages/remind-room-presence";
import { isValidCronSecret } from "@/lib/cron-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!isValidCronSecret(authHeader, process.env.CRON_SECRET)) {
        return NextResponse.json({ success: false }, { status: 401 });
    }

    // In production, vercel will suspense the db connection right after function ends
    await remindRoomsPresence();

    return NextResponse.json({ success: true });
}
