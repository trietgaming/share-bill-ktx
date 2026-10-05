import { invalidateAllRoomQuery, queryClient, userRoomsQueryKey } from "@/lib/query-client";
import { ForegroundMessageHandler } from "../foreground-message-dispatcher";

export const handleRoomMemberChange: ForegroundMessageHandler<{
    roomId: string;
}> = async (data) => {
    // Invalidate invoices query for the specific room
    invalidateAllRoomQuery(data.roomId);
    await queryClient.invalidateQueries({ queryKey: userRoomsQueryKey() });
};
