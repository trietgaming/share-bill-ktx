export const enum NotificationType {
    PRESENCE_REMINDER = 'presence_reminder',
    MONTH_PRESENCE_FULFILLED = 'month_presence_fulfilled',

    NEW_INVOICE = 'new_invoice',
    UPDATE_INVOICE = 'update_invoice',
    DELETE_INVOICE = 'delete_invoice',

    PAYMENT_REMINDER = 'payment_reminder',

    ROOM_MEMBER_JOINED = 'room_member_joined',
    ROOM_MEMBER_LEFT = 'room_member_left',
    KICKED_FROM_ROOM = 'kicked_from_room',
    ROOM_DELETED = 'room_deleted',
}

export const enum NotificationClickAction {
    MARK_PRESENT = 'MARK_PRESENT',
    MARK_ABSENT = 'MARK_ABSENT',
}