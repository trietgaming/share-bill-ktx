"use client";
import type { NotificationFactory } from "@/lib/notification/notification-factory";
import { DeleteInvoiceNotificationData } from "@/types/notification";

export const createDeleteInvoiceNotification: NotificationFactory<DeleteInvoiceNotificationData>
    = (data) => {
        return {
            title: `Hóa đơn ${data.invoiceName} đã bị xóa ở phòng ${data.roomName}`,
            body: `${data.deleteUserName} đã xóa hóa đơn này.`,
            // icon: '/icons/delete-invoice.png',
            data,
        };
    };