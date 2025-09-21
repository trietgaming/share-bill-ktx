import { MarkPresenceBody } from "@/types/actions";
import { PresenceReminderNotificationData } from "@/types/notification";

export async function markPresent(data: PresenceReminderNotificationData) {
    try {
        const response = await fetch("/api/presence", {
            method: "POST",
            body: JSON.stringify({
                roomId: data.roomId,
                month: data.month,
                day: Number.parseInt(data.day),
                status: "present",
            } as MarkPresenceBody),
        });

        if (!response.ok) {
            console.error("Failed to mark present:", response);
        }
    } catch (error) {
        console.error("Error marking present:", error);
    }
}