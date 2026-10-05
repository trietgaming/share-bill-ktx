import type { NotificationFactory } from "../notification-factory";
import type {
    MonthPresenceFulfilledNotificationData,
    PaymentReminderNotificationData,
} from "@/types/notification";

export const createMonthPresenceFulfilledNotification: NotificationFactory<MonthPresenceFulfilledNotificationData> = (data) => ({
    title: `Phòng ${data.roomName} đã tích đủ ngày ở tháng ${data.month}`,
    body: "Mở ứng dụng để xem ngày ở và hóa đơn.",
    data,
});

export const createPaymentReminderNotification: NotificationFactory<PaymentReminderNotificationData> = (data) => ({
    title: `Nhắc thanh toán hóa đơn ở phòng ${data.roomName}`,
    body: `Hóa đơn ${data.invoiceName} đang chờ thanh toán.`,
    data,
});
