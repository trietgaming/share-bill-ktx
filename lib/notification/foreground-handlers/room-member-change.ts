import { invalidateAllRoomQuery } from "@/lib/query-client";
import { ForegroundMessageHandler } from "../foreground-message-dispatcher";

export const handleRoomMemberChange: ForegroundMessageHandler<{
    roomId: string;
}> = (data) => {
    // Invalidate invoices query for the specific room
    invalidateAllRoomQuery(data.roomId);
};
