import "server-only";
import { IUserData } from "@/types/user-data";
import { notifyUser } from "../notify";
import { delay, parseYYYYMM, toYYYYMM } from "../utils";
import { PresenceReminderNotificationData } from "@/types/notification";
import {
    NotificationClickAction,
    NotificationType,
} from "@/enums/notification";
import { Room } from "@/models/Room";
import { IRoomDocument } from "@/types/room";

type PopulatedRoom = Omit<IRoomDocument, "members"> & {
    members: { _id: string; fcmTokens: string[] }[];
};

const delayBetweenRooms = 500; // milliseconds

// Run with cursor like 20 membership per call, support next cursor
export async function remindRoomsPresence() {
    // TODO: needs rewritten

    let lastId: string | null = null;
    const limit = 20;
    const now = new Date();
    const month = toYYYYMM(now);
    const day = (now.getDate() - 1).toString();

    while (true) {
        console.log("Processing rooms after ID:", lastId);
        const query: any = {};
        if (lastId) {
            query._id = { $gt: lastId };
        }

        const rooms: PopulatedRoom[] = await Room.find(query)
            .sort({ _id: 1 })
            .limit(limit)
            .select({ name: 1, members: 1 })
            .populate<{ members: IUserData[] }>("members", { fcmTokens: 1 })
            .lean();

        if (rooms.length === 0) {
            break;
        }

        lastId = rooms[rooms.length - 1]._id;

        for (const room of rooms) {
            console.log(`Sending reminders for room: ${room.name} (${room._id})`);
            for (const member of room.members) {
                sendRemindNotification({
                    roomId: room._id,
                    roomName: room.name,
                    month: month,
                    day: day,
                    user: member,
                });
            }
            await delay(delayBetweenRooms);
        }
    }
}

export async function sendRemindNotification(payload: {
    roomId: string;
    roomName: string;
    month: string;
    day: string;
    user: Pick<IUserData, "_id" | "fcmTokens">;
}) {
    console.log(`Notifying user ${payload.user._id} for room ${payload.roomName} (${payload.roomId})`);
    await notifyUser<PresenceReminderNotificationData>(payload.user, {
        data: {
            type: NotificationType.PRESENCE_REMINDER,
            day: payload.day,
            month: payload.month,
            roomId: payload.roomId,
            roomName: payload.roomName,
        },
        android: {
            priority: "high",
        },
    });
    console.log(`Notification sent to user ${payload.user._id}`);
}
