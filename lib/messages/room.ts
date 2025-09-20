import {
    DeleteInvoiceNotificationData,
    NewInvoiceNotificationData,
} from "@/types/notification";
import { IRoom } from "@/types/room";
import "server-only";
import { notify, notifyUser } from "@/lib/notify";
import { NotificationType } from "@/enums/notification";
import { IInvoice } from "@/types/invoice";
import { Room } from "@/models/Room";
import { UserData } from "@/models/UserData";
import { IUserData } from "@/types/user-data";

export async function sendNewInvoiceNotification(invoice: IInvoice) {
    const room = (await Room.findById(invoice.roomId, [
        "name",
    ]).lean()) as IRoom | null;
    if (!room) return;

    const users = await UserData.find({ _id: { $in: invoice.applyTo } }, [
        "fcmTokens",
    ]).lean();

    for (const user of users) {
        if (!user.fcmTokens || user._id === invoice.createdBy) continue;
        notifyUser<NewInvoiceNotificationData>(user, {
            data: {
                type: NotificationType.NEW_INVOICE,
                persistent: "true",
                invoiceId: invoice._id.toString(),
                invoiceName: invoice.name,
                invoiceAmount: invoice.amount.toString(),
                roomId: invoice.roomId,
                roomName: room.name,
            },
        });
    }
}

export async function sendDeleteInvoiceNotification(
    invoice: IInvoice,
    deleteUserId: string
) {
    const room = (await Room.findById(invoice.roomId, [
        "name",
    ]).lean()) as IRoom | null;
    if (!room) return;

    const users = await UserData.find({ _id: { $in: invoice.applyTo } }, [
        "fcmTokens",
    ]).lean();
    const deleteUser = await UserData.findById(deleteUserId, [
        "displayName",
    ]).lean();

    if (!deleteUser) return;

    for (const user of users) {
        if (!user.fcmTokens || user._id === deleteUserId) continue;
        notifyUser<DeleteInvoiceNotificationData>(user, {
            data: {
                type: NotificationType.DELETE_INVOICE,
                persistent: "true",
                invoiceId: invoice._id.toString(),
                invoiceName: invoice.name,
                deleteUserName: deleteUser.displayName || "Một thành viên",
                roomId: invoice.roomId,
                roomName: room.name,
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

    await notifyUser(user, {
        notification: {
            title: `Bạn đã bị xóa khỏi phòng ${room.name}`,
        },
        data: {
            type: NotificationType.KICKED_FROM_ROOM,
            persistent: "true",
            roomId: roomId,
            roomName: room.name,
        },
    });
}
