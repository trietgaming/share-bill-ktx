import { RoomProvider } from '@/components/room/contexts/room-context';
import { RoomLayout } from '@/components/room/room-layout';
import { getAuthenticatedUser } from '@/lib/firebase/server';
import { serializeDocument } from '@/lib/serializer';
import { Membership } from '@/models/Membership';
import { IRoomDocument, IRoom } from '@/types/room';
import mongoose, { Document } from 'mongoose';
import { notFound } from 'next/navigation';
import 'server-only';

export default async function RoomPage({
    params,
    children
}: {
    params: Promise<{ roomId: string }>,
    children: React.ReactNode
}) {
    const { roomId } = await params;
    const user = await getAuthenticatedUser();

    if (!user || !roomId) return notFound();

    const membership = await Membership.findOne({ user: user.uid, room: roomId }).populate<{ room: IRoom }>('room').lean();

    if (!membership || !membership.room) {
        return notFound()
    }

    return <RoomProvider initialRoom={membership.room}>
        <RoomLayout>
            {children}
        </RoomLayout>
    </RoomProvider>
}