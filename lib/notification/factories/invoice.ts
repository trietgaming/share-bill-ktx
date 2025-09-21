"use client";
import { formatCurrency } from "@/lib/utils";
import type { NotificationFactory } from "@/lib/notification/notification-factory";
import {
    DeleteInvoiceNotificationData,
    NewInvoiceNotificationData,
    UpdateInvoiceNotificationData,
} from "@/types/notification";

export const createNewInvoiceNotification: NotificationFactory<
    NewInvoiceNotificationData
> = (data) => {
    return {
        title: `Có hóa đơn mới ở phòng ${data.roomName}`,
        body: `${data.invoiceName}: ${formatCurrency(
            Number(data.invoiceAmount)
        )}`,
        icon: "/icons/add-invoice.png",
        data,
    };
};

export const createDeleteInvoiceNotification: NotificationFactory<
    DeleteInvoiceNotificationData
> = (data) => {
    return {
        title: `Hóa đơn ${data.invoiceName} đã bị xóa ở phòng ${data.roomName}`,
        body: `${data.deleteUserName} đã xóa hóa đơn này.`,
        // icon: '/icons/delete-invoice.png',
        data,
    };
};

export const createUpdateInvoiceNotification: NotificationFactory<
    UpdateInvoiceNotificationData
> = (data) => {
    return {
        title: `Hóa đơn ${data.invoiceName} đã được cập nhật ở phòng ${data.roomName}`,
        body: `${data.updateUserName} đã cập nhật hóa đơn này.`,
        data,
    };
};
