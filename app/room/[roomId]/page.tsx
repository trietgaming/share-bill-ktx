import { RoomProvider } from '@/components/room/room-context';
import { RoomLayout } from '@/components/room/room-layout';
import { getAuthenticatedUser } from '@/lib/firebase/server';
import { getUserDataById } from '@/lib/user-data';
import { notFound } from 'next/navigation';
import 'server-only';

export default async function RoomPage({
    params
}: {
    params: Promise<{ roomId: string }>
}) {
    const { roomId } = await params;
    const user = await getAuthenticatedUser();
    const userData = user ? await getUserDataById(user.uid) : null;

    const room = userData?.roomsJoined.find(r => r.room._id === roomId)?.room;

    if (!roomId || !user || !userData || !room) {
        return notFound()
    }

    return <RoomProvider room={room}>
        <RoomLayout />
    </RoomProvider>
}