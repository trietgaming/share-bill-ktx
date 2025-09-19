"use client";
import { formatCurrency } from "@/lib/utils";
import type { NotificationFactory } from "@/lib/notification/notification-factory";
import { NewInvoiceNotificationData } from "@/types/notification";

export const createNewInvoiceNotification: NotificationFactory<NewInvoiceNotificationData>
    = (data) => {
        return {
            title: `Có hóa đơn mới ở phòng ${data.roomName}`,
            body: `${data.invoiceName}: ${formatCurrency(Number(data.invoiceAmount))}`,
            icon: '/icons/add-invoice.png',
            data,
        };
    };