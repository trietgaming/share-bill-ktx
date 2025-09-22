import { queryClient, presenceQueryKey } from "@/lib/query-client";
import { MarkPresenceBody } from "@/types/actions";
import { PresenceReminderNotificationData } from "@/types/notification";

export async function markAbsent(
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
                status: "absent",
            } as MarkPresenceBody),
        });

        if (!response.ok) {
            console.error("Failed to mark absent:", response);
        }
        if (isForeground) {
            queryClient.invalidateQueries({
                queryKey: presenceQueryKey(data.roomId, data.month),
            });
        }
    } catch (error) {
        console.error("Error marking absent:", error);
    }
}
