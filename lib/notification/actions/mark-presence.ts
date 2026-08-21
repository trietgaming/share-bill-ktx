import { presenceQueryKey, queryClient } from "@/lib/query-client";
import { MarkPresenceBody } from "@/types/actions";
import { PresenceReminderNotificationData } from "@/types/notification";
import { PresenceStatus } from "@/enums/presence";

export async function markPresence(
    data: PresenceReminderNotificationData,
    status: PresenceStatus,
    isForeground = false
) {
    try {
        const response = await fetch("/api/presence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                roomId: data.roomId,
                month: data.month,
                day: Number.parseInt(data.day, 10),
                status,
            } as MarkPresenceBody),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to mark presence (${status}): ${response.status}`
            );
        }

        if (isForeground) {
            queryClient.invalidateQueries({
                queryKey: presenceQueryKey(data.roomId, data.month),
            });
        }
    } catch (error) {
        console.error("Error marking presence:", error);
    }
}
