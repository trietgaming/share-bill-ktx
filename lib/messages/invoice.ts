import {
    DeleteInvoiceNotificationData,
    NewInvoiceNotificationData,
    UpdateInvoiceNotificationData,
} from "@/types/notification";
import { IRoom } from "@/types/room";
import "server-only";
import { notifyUsers } from "@/lib/notify";
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

    await notifyUsers<NewInvoiceNotificationData>(
        users.filter((user) => user.fcmTokens?.length && user._id !== invoice.createdBy), {
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

    await notifyUsers<UpdateInvoiceNotificationData>(
        users.filter((user) => user.fcmTokens?.length && user._id !== updateUserId), {
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

    await notifyUsers<DeleteInvoiceNotificationData>(
        users.filter((user) => user.fcmTokens?.length && user._id !== deleteUserId), {
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
