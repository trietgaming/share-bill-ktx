import { presenceQueryKey, queryClient } from "@/lib/query-client";
import { MarkPresenceBody } from "@/types/actions";
import { PresenceReminderNotificationData } from "@/types/notification";
import { PresenceStatus } from "@/enums/presence";

export async function markPresence(
    data: PresenceReminderNotificationData,
    status: PresenceStatus,
    isForeground = false
) {
    const response = await fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            roomId: data.roomId,
            month: data.month,
            day: Number(data.day),
            status,
            recipientId: data.recipientId,
        } satisfies MarkPresenceBody),
    });

    if (!response.ok) {
        throw new Error(
            response.status === 401
                ? "Phiên đăng nhập đã hết hạn. Mở ứng dụng để đăng nhập và thử lại."
                : "Không thể tích ngày ở. Vui lòng thử lại."
        );
    }

    if (isForeground) {
        await queryClient.invalidateQueries({
            queryKey: presenceQueryKey(data.roomId),
        });
    }
}
