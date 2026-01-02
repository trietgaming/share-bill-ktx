import { queryClient, invoicesQueryKey, paidInvoicesQueryKey } from "@/lib/query-client";
import { ForegroundMessageHandler } from "../foreground-message-dispatcher";

export const handleInvoicesChange: ForegroundMessageHandler<{
    roomId: string;
}> = (data) => {
    // Invalidate invoices query for the specific room
    queryClient.invalidateQueries({
        queryKey: invoicesQueryKey(data.roomId),
    });
    queryClient.invalidateQueries({
        queryKey: paidInvoicesQueryKey(data.roomId),
    });
};
