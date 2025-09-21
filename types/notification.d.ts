import { NotificationType } from "@/enums/notification";
import { MessagePayload, NotificationPayload } from "firebase/messaging";
import { AndroidConfig, ApnsConfig, FcmOptions, WebpushConfig } from "firebase-admin/messaging";

export interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
}

export interface NotificationSendOptions<T extends NotificationData> {
    /**
     * If specified, it will override the title and body in the notification payload.
     */
    notification?: {
        /**
         * The title of the notification.
         */
        title?: string;
        /**
         * The notification body
         */
        body?: string;
        /**
         * URL of an image to be displayed in the notification.
         */
        imageUrl?: string;
    };
    data: T;
    android?: AndroidConfig;
    webpush?: WebpushConfig;
    apns?: ApnsConfig;
    fcmOptions?: FcmOptions;
}

export interface AdditionalNotificationOptions {
    actions?: NotificationAction[];
    renotify?: boolean;
    badge?: string;
    dir?: NotificationDirection;
    icon?: string;
    lang?: string;
    requireInteraction?: boolean;
    silent?: boolean | null;
    tag?: string;
    renotify?: boolean;
}

/**
 * Data must be serializable to string key-value pairs.
 */
export interface NotificationData extends Record<string, string> {
    type?: NotificationType;
    /**
     * Indicates whether the notification should be stored in the notification center or not.
     */
    persistent?: "true" | "false";
}

/**
 * Extends the NotificationOptions to support limited features
 */
export interface ExtendedNotificationOptions extends NotificationOptions {
    actions?: NotificationAction[];
    renotify?: boolean;
}

export interface NotificationBlueprint<T extends NotificationData>
    extends ExtendedNotificationOptions {
    title: string;
    data: T;
}

export interface AdditionalNotificationData {
    status: "read" | "unread";
    /**
     * Time since epoch when the notification was received.
     */
    receivedAt: number;
}

export interface ForegroundNotification
    extends NotificationPayload,
        AdditionalNotificationData {}

export interface NewInvoiceNotificationData extends NotificationData {
    type: NotificationType.NEW_INVOICE;
    roomId: string;
    roomName: string;
    invoiceId: string;
    invoiceName: string;
    invoiceAmount: string;
}

export interface UpdateInvoiceNotificationData extends NotificationData {
    type: NotificationType.INVOICE_UPDATE;
    roomId: string;
    roomName: string;
    invoiceId: string;
    invoiceName: string;
    updateUserName: string;
}

export interface DeleteInvoiceNotificationData extends NotificationData {
    type: NotificationType.DELETE_INVOICE;
    roomId: string;
    roomName: string;
    invoiceName: string;
    deleteUserName: string;
}

export interface MemberLeftNotificationData extends NotificationData {
    type: NotificationType.ROOM_MEMBER_LEFT;
    roomId: string;
    roomName: string;
    memberName: string;
}

export interface MemberJoinedNotificationData extends NotificationData {
    type: NotificationType.ROOM_MEMBER_JOINED;
    roomId: string;
    roomName: string;
    memberName: string;
}

export interface RoomDeletedNotificationData extends NotificationData {
    type: NotificationType.ROOM_DELETED;
    roomId: string;
    roomName: string;
    deleteByUserName: string;
}

export interface PresenceReminderNotificationData extends NotificationData {
    type: NotificationType.PRESENCE_REMINDER;
    roomId: string;
    roomName: string;
    /**
     * Month in the format of YYYY-MM
     */
    month: string;
    /**
     * 0-based day of the month
     */
    day: string;
}
