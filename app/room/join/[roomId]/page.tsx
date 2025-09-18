import { ConfirmJoinRoomPage } from "@/components/join-room/confirm-join";
import { getAuthenticatedUser } from "@/lib/firebase/server";
import { Membership } from "@/models/Membership";
import { Room } from "@/models/Room";
import { notFound, redirect } from "next/navigation";

export default async function JoinRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = await params;

    const user = await getAuthenticatedUser();

    if (!user) return notFound();

    const membership = await Membership.findOne({ user: user.uid, room: roomId }).lean();

    if (membership) {
        return redirect(`/room/${roomId}`);
    }

    const room = await Room.findById(roomId).lean();

    if (!room) return notFound();

    return <ConfirmJoinRoomPage room={room} />;
} 
