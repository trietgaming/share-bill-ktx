import { RoomProvider } from '@/components/room/room-context';
import { RoomLayout } from '@/components/room/room-layout';
import { getAuthenticatedUser } from '@/lib/firebase/server';
import { serializeDocument } from '@/lib/serializer';
import { Membership } from '@/models/Membership';
import { IRoom, IRoomDocument } from '@/types/Room';
import mongoose, {Document} from 'mongoose';
import { notFound } from 'next/navigation';
import 'server-only';

export default async function RoomPage({
    params
}: {
    params: Promise<{ roomId: string }>
}) {
    const { roomId } = await params;
    const user = await getAuthenticatedUser();

    if (!user || !roomId) return notFound();

    const membership = await Membership.findOne({ user: user.uid, room: roomId }).populate<{room: IRoom}>('room').lean();
    
    if (!membership) {
        return notFound()
    }

    return <RoomProvider initialRoom={membership.room}>
        <RoomLayout />
    </RoomProvider>
}