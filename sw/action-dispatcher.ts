export function dispatchAction(action: string, payload: any) {
    switch (action) {
        // case NotificationClickAction.MARK_PRESENT:
        //     return handleMarkPresent(payload);
        // case NotificationClickAction.MARK_ABSENT:
        //     return handleMarkAbsent(payload);
        default:
            console.log('Unknown action:', action);
    }
}