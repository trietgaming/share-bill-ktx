import { presenceQueryKey, queryClient } from "@/lib/query-client";
import { MarkPresenceBody } from "@/types/actions";
import { PresenceReminderNotificationData } from "@/types/notification";
import { PresenceStatus } from "@/enums/presence";

export async function markPresent(
    data: PresenceReminderNotificationData,
    isForeground = false
) {
    try {
        const response = await fetch("/api/presence", {
            method: "POST",
            body: JSON.stringify({
                roomId: data.roomId,
                month: data.month,
                day: Number.parseInt(data.day),
                status: PresenceStatus.PRESENT,
            } as MarkPresenceBody),
        });

        if (!response.ok) {
            console.error("Failed to mark present:", response);
        }
        if (isForeground) {
            queryClient.invalidateQueries({
                queryKey: presenceQueryKey(data.roomId, data.month),
            });
        }
    } catch (error) {
        console.error("Error marking present:", error);
    }
}
