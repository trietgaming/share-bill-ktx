import {
    DeleteInvoiceNotificationData,
    NewInvoiceNotificationData,
    UpdateInvoiceNotificationData,
} from "@/types/notification";
import { IRoom } from "@/types/room";
import "server-only";
import { notify, notifyUser } from "@/lib/notify";
import { NotificationType } from "@/enums/notification";
import { IInvoice } from "@/types/invoice";
import { Room } from "@/models/Room";
import { UserData } from "@/models/UserData";

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

export async function sendUpdateInvoiceNotification(
    invoice: IInvoice,
    updateUserId: string
) {
    const room = (await Room.findById(invoice.roomId, [
        "name",
    ]).lean()) as IRoom | null;

    if (!room) return;

    const users = await UserData.find({ _id: { $in: invoice.applyTo } }, [
        "fcmTokens",
    ]).lean();

    const updateUser = await UserData.findById(updateUserId, [
        "displayName",
    ]).lean();
    
    if (!updateUser) return;

    for (const user of users) {
        if (!user.fcmTokens || user._id === updateUserId) continue;

        notifyUser<UpdateInvoiceNotificationData>(user, {
            data: {
                type: NotificationType.UPDATE_INVOICE,
                persistent: "true",
                invoiceId: invoice._id.toString(),
                invoiceName: invoice.name,
                updateUserName: updateUser.displayName || "Một thành viên",
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
