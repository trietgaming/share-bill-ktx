import type { NotificationFactory } from "../notification-factory";
import type {
    MemberJoinedNotificationData,
    MemberLeftNotificationData,
    KickedFromRoomNotificationData,
    RoomDeletedNotificationData,
} from "@/types/notification";

export const createMemberJoinedNotification: NotificationFactory<MemberJoinedNotificationData> = (data) => ({
    title: `Thành viên ${data.memberName} vừa tham gia phòng ${data.roomName}`,
    data,
});

export const createMemberLeftNotification: NotificationFactory<MemberLeftNotificationData> = (data) => ({
    title: `Thành viên ${data.memberName} đã rời khỏi phòng ${data.roomName}`,
    data,
});

export const createKickedFromRoomNotification: NotificationFactory<KickedFromRoomNotificationData> = (data) => ({
    title: `Bạn đã bị xóa khỏi phòng ${data.roomName}`,
    body: "Bạn có thể tham gia lại bất cứ lúc nào.",
    data,
});

export const createRoomDeletedNotification: NotificationFactory<RoomDeletedNotificationData> = (data) => ({
    title: `Phòng ${data.roomName} đã bị xóa`,
    body: "Bạn không thể truy cập phòng này nữa.",
    data,
});
