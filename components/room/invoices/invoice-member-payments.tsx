import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/components/user-avatar";
import { InvoiceSplitMethod } from "@/enums/invoice";
import { handleAction } from "@/lib/action-handler";
import { getRoomMonthsPresence } from "@/lib/actions/month-presence";
import { presenceQueryKey } from "@/lib/query-client";
import { calculateShare, formatCurrency } from "@/lib/utils";
import { IInvoice } from "@/types/invoice";
import { IMonthPresence } from "@/types/month-presence";
import { useRoommates } from "../contexts/room-context";

export function InvoiceMemberPayments({
    invoice,
    monthPresences,
}: {
    invoice: IInvoice;
    monthPresences?: IMonthPresence[];
}) {
    const {
        roommatesQuery: { data: roommates },
    } = useRoommates();
    const needsPresence = invoice.splitMethod === InvoiceSplitMethod.BY_PRESENCE;
    const presenceQuery = useQuery({
        queryKey: [
            ...presenceQueryKey(invoice.roomId),
            "invoice-months",
            invoice.monthApplied,
        ],
        queryFn: () =>
            handleAction(
                getRoomMonthsPresence(invoice.roomId, [invoice.monthApplied!])
            ),
        enabled: needsPresence && !!invoice.monthApplied && !monthPresences,
        staleTime: 1000 * 60 * 60,
    });
    const presences = monthPresences ?? presenceQuery.data;

    return invoice.applyTo.map((userId) => {
        const roommate = roommates?.find((rm) => rm.userId === userId);
        if (!roommate) return null;

        const paidAmount = invoice.payInfo
            .filter((payment) => payment.paidBy === userId)
            .reduce((total, payment) => total + payment.amount, 0);
        const shareAmount =
            needsPresence && !presences
                ? undefined
                : Math.round(calculateShare(invoice, userId, presences ?? [])[0]);

        return (
            <div
                key={userId}
                className="flex flex-wrap items-center gap-2 justify-between text-muted-foreground text-xs"
            >
                <div className="flex items-center gap-2">
                    <UserAvatar className="w-4 h-4 shrink-0" user={roommate} />
                    <span>
                        <b>{roommate.displayName}</b> đã thanh toán
                    </span>
                </div>
                <b>
                    {formatCurrency(paidAmount)} /{" "}
                    {shareAmount === undefined
                        ? presenceQuery.isError || !invoice.monthApplied
                            ? "Chưa xác định"
                            : "Đang tính..."
                        : formatCurrency(shareAmount)}
                </b>
            </div>
        );
    });
}
