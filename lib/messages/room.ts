import { NotificationType } from "@/enums/notification";
import { Room } from "@/models/Room";
import { UserData } from "@/models/UserData";
import { notifyUsers } from "@/lib/notify";
import type { IRoom } from "@/types/room";
import {
    MemberJoinedNotificationData,
    MemberLeftNotificationData,
    RoomDeletedNotificationData,
} from "@/types/notification";

export async function sendRoomJoinedNotification(
    roomId: string,
    newMemberId: string
) {
    const room = await Room.findById(roomId, ["name", "members"]).lean();
    if (!room) return;

    const roomMembers = await UserData.find({ _id: { $in: room.members } }, [
        "fcmTokens",
    ]).lean();
    const newMember = await UserData.findById(newMemberId, [
        "displayName",
    ]).lean();

    if (!newMember) return;

    await notifyUsers<MemberJoinedNotificationData>(
        roomMembers.filter((member) => member.fcmTokens?.length && member._id !== newMemberId), {
            notification: {
                title: `Thành viên ${newMember.displayName} vừa tham gia phòng ${room.name}`,
            },
            data: {
                type: NotificationType.ROOM_MEMBER_JOINED,
                persistent: "true",
                roomId: roomId,
                roomName: room.name,
                memberName: newMember.displayName || "Thành viên",
            },
        });
}

export async function sendRoomLeftNotification(
    roomId: string,
    leftUserId: string
) {
    const room = await Room.findById(roomId, ["name", "members"]).lean();
    if (!room) return;

    const roomMembers = await UserData.find({ _id: { $in: room.members } }, [
        "fcmTokens",
    ]).lean();
    const leftUser = await UserData.findById(leftUserId, [
        "displayName",
    ]).lean();
    if (!leftUser) return;

    await notifyUsers<MemberLeftNotificationData>(
        roomMembers.filter((member) => member.fcmTokens?.length && member._id !== leftUserId), {
            notification: {
                title: `Thành viên ${leftUser.displayName} đã rời khỏi phòng ${room.name}`,
            },
            data: {
                type: NotificationType.ROOM_MEMBER_LEFT,
                persistent: "true",
                roomId: roomId,
                roomName: room.name,
                memberName: leftUser.displayName || "Thành viên",
            },
        });
}
export async function sendNotificationToKickedMember(
    userId: string,
    roomId: string
) {
    const room = await Room.findById(roomId, ["name"]).lean();
    const user = await UserData.findById(userId, ["fcmTokens"]).lean();

    if (!user || !room || !user.fcmTokens || user.fcmTokens.length === 0)
        return;

    await notifyUsers([user], {
        notification: {
            title: `Bạn đã bị xóa khỏi phòng ${room.name}`,
            body: "Bạn có thể tham gia lại bất cứ lúc nào.",
        },
        data: {
            type: NotificationType.KICKED_FROM_ROOM,
            persistent: "true",
            roomId: roomId,
            roomName: room.name,
        },
    });
}

export async function sendRoomDeletedNotification(
    deleteByUserId: string,
    room: Pick<IRoom, "_id" | "name" | "members">
) {
    const roomMembers = await UserData.find({ _id: { $in: room.members } }, [
        "fcmTokens",
    ]).lean();

    const deleteByUser = await UserData.findById(deleteByUserId, [
        "displayName",
    ]).lean();

    await notifyUsers<RoomDeletedNotificationData>(
        roomMembers.filter((member) => member.fcmTokens?.length && member._id !== deleteByUserId), {
            notification: {
                title: `Phòng ${room.name} đã bị xóa`,
                body: "Bạn không thể truy cập phòng này nữa.",
            },
            data: {
                type: NotificationType.ROOM_DELETED,
                persistent: "true",
                roomId: room._id.toString(),
                roomName: room.name,
                deleteByUserName: deleteByUser?.displayName || "Quản trị viên",
            },
        });
}
