import { NotificationType } from "@/enums/notification";
import { Room } from "@/models/Room";
import { UserData } from "@/models/UserData";
import { notifyUser } from "@/lib/notify";
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

    for (const member of roomMembers) {
        if (!member.fcmTokens || member._id === newMemberId) continue;

        notifyUser<MemberJoinedNotificationData>(member, {
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

    for (const member of roomMembers) {
        if (!member.fcmTokens || member._id === leftUserId) continue;

        notifyUser<MemberLeftNotificationData>(member, {
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
}
export async function sendNotificationToKickedMember(
    userId: string,
    roomId: string
) {
    const room = await Room.findById(roomId, ["name"]).lean();
    const user = await UserData.findById(userId, ["fcmTokens"]).lean();

    if (!user || !room || !user.fcmTokens || user.fcmTokens.length === 0)
        return;

    notifyUser(user, {
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
    roomId: string
) {
    const room = await Room.findById(roomId, ["name", "members"]).lean();
    if (!room) return;

    const roomMembers = await UserData.find({ _id: { $in: room.members } }, [
        "fcmTokens",
    ]).lean();

    const deleteByUser = await UserData.findById(deleteByUserId, [
        "displayName",
    ]).lean();

    for (const member of roomMembers) {
        if (!member.fcmTokens || member._id === deleteByUserId) continue;

        notifyUser<RoomDeletedNotificationData>(member, {
            notification: {
                title: `Phòng ${room.name} đã bị xóa`,
                body: "Bạn không thể truy cập phòng này nữa.",
            },
            data: {
                type: NotificationType.ROOM_DELETED,
                persistent: "true",
                roomId: roomId,
                roomName: room.name,
                deleteByUserName: deleteByUser?.displayName || "Quản trị viên",
            },
        });
    }
}
