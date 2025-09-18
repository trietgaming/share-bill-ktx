import { NotificationType } from "@/enums/notification";

export interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
}

export interface NotificationSendOptions {
    body?: string;
    icon?: string;
    title: string;
    imageUrl?: string;
    data: NotificationData
}

export interface NotificationData {
    type?: NotificationType;
    actions?: NotificationAction[];
    badge?: string;
    dir?: NotificationDirection;
    icon?: string;
    lang?: string;
    requireInteraction?: boolean;
    silent?: boolean | null;
    tag?: string;
    renotify?: boolean;
    /**
     * Indicates whether the notification should
     */
    persistent?: boolean;
}
