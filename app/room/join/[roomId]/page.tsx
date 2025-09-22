import { ConfirmJoinRoomPage } from "@/components/join-room/confirm-join";
import { getAuthenticatedUser } from "@/lib/firebase/server";
import { Membership } from "@/models/Membership";
import { Room } from "@/models/Room";
import { notFound, redirect } from "next/navigation";

export default async function JoinRoomPage({
    params,
    searchParams,
}: {
    params: Promise<{ roomId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { roomId } = await params;
    const searchParamStore = await searchParams;

    const user = await getAuthenticatedUser();

    if (!user) return notFound();

    const membership = await Membership.findOne({
        user: user.uid,
        room: roomId,
    }).lean();

    if (membership) {
        return redirect(`/room/${roomId}`);
    }

    const room = await Room.findById(roomId).lean();
    const token = Array.isArray(searchParamStore.token)
        ? searchParamStore.token[0]
        : searchParamStore.token;

    if (!room || (room.isPrivate && token !== room.inviteToken))
        return notFound();

    return <ConfirmJoinRoomPage room={room} token={token} />;
}
