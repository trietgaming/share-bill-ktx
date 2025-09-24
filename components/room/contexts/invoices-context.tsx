import { createContext, useContext, useMemo, useState } from "react";
import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { useRoommates, useRoomQuery } from "./room-context";
import { IInvoice, PersonalInvoice } from "@/types/invoice";
import {
    invoicesQueryKey,
    presenceQueryKey,
    queryClient,
} from "@/lib/query-client";
import { getInvoicesByRoom } from "@/lib/actions/invoice";
import { getRoomMonthsPresence } from "@/lib/actions/month-presence";
import { IMonthPresence } from "@/types/month-presence";
import { InvoiceCheckoutDialog } from "../invoice-checkout-dialog";
import { handleAction } from "@/lib/action-handler";
import { InvoiceDialog } from "@/components/room/invoice-dialog";
import { PresenceStatus } from "@/enums/presence";

interface InvoicesContextType {
    pendingInvoicesQuery: UseQueryResult<IInvoice[], Error>;
    /** Personal amount must be calculated using presence info */
    monthlyInvoices: PersonalInvoice[];
    otherInvoices: PersonalInvoice[];
    openInvoiceCheckoutDialog: (invoice: PersonalInvoice) => void;
    addInvoiceType: IInvoice["type"] | null;
    setAddInvoiceType: React.Dispatch<
        React.SetStateAction<IInvoice["type"] | null>
    >;
    editingInvoice: IInvoice | null;
    setEditingInvoice: React.Dispatch<React.SetStateAction<IInvoice | null>>;
}

const InvoicesContext = createContext<InvoicesContextType>(
    {} as InvoicesContextType
);

export const InvoicesProvider = ({ children }: { children: any }) => {
    const { userData } = useAuth();
    const { data: room } = useRoomQuery();
    const {
        roommatesQuery: { data: roommates },
    } = useRoommates();

    const pendingInvoicesQuery = useQuery<IInvoice[]>({
        queryKey: invoicesQueryKey(room._id),
        queryFn: () => {
            queryClient.invalidateQueries({
                queryKey: presenceQueryKey(room._id),
            });
            return handleAction(getInvoicesByRoom(room._id));
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    const monthsPresenceQuery = useQuery({
        queryKey: presenceQueryKey(room._id),
        queryFn: async () => {
            const months = pendingInvoicesQuery.data
                ?.filter(
                    (inv) => inv.type === "walec" || inv.type === "roomCost"
                )
                .map((inv) => inv.monthApplied!)
                .filter((v, i, a) => a.indexOf(v) === i); // unique

            if (!months || months.length === 0) return [];

            const monthsPresence = await handleAction(
                getRoomMonthsPresence(room._id, months)
            );
            return monthsPresence;
        },
        enabled: !!pendingInvoicesQuery.data,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    const otherInvoices = useMemo<PersonalInvoice[]>(() => {
        if (!pendingInvoicesQuery.data) return [];

        return pendingInvoicesQuery.data
            .filter(
                (inv) =>
                    inv.type === "other" && inv.applyTo.includes(userData!._id)
            )
            .map((inv) => {
                const userPaidAmount =
                    inv.payInfo
                        ?.filter((p) => p.paidBy === userData!._id)
                        .reduce((sum, p) => sum + p.amount, 0) || 0;
                const personalAmount = Math.round(
                    (inv.amount || 0) / (inv.applyTo.length || 1) -
                        userPaidAmount
                );
                return {
                    ...inv,
                    personalAmount,
                    isPaidByMe: personalAmount <= 0,
                    myPayInfo: inv.payInfo?.find(
                        (p) => p.paidBy === userData!._id
                    ),
                };
            });
    }, [pendingInvoicesQuery.data]);

    const monthlyInvoices = useMemo(() => {
        if (
            !pendingInvoicesQuery.data ||
            !monthsPresenceQuery.data ||
            !roommates
        )
            return [];

        const monthlyInvoices = pendingInvoicesQuery.data.filter(
            (inv) =>
                (inv.type === "walec" || inv.type === "roomCost") &&
                inv.applyTo.includes(userData!._id)
        );

        const roomPresenceMap: Record<string, IMonthPresence[]> = {};
        monthlyInvoices.forEach((inv) => {
            if (!inv.monthApplied) return;
            const roomMonthPresence = monthsPresenceQuery.data.filter(
                (a) => a.month === inv.monthApplied
            );
            if (roomMonthPresence.length < roommates.length) {
                const existingUserIds = roomMonthPresence.map((a) => a.userId);
                const missingRoommates = roommates.filter(
                    (r) => !existingUserIds.includes(r.userId)
                );
                missingRoommates.forEach((r) => {
                    roomMonthPresence.push({
                        month: inv.monthApplied!,
                        roomId: room._id,
                        userId: r.userId,
                        presence: Array(31).fill(PresenceStatus.UNDETERMINED),
                    });
                });
            }
            roomPresenceMap[inv.monthApplied] = roomMonthPresence;
        });

        return monthlyInvoices.map((inv) => {
            const userPaidAmount =
                inv.payInfo
                    ?.filter((p) => p.paidBy === userData!._id)
                    .reduce((sum, p) => sum + p.amount, 0) || 0;
            const roomPresence = roomPresenceMap[inv.monthApplied!];
            const myPresence = roomPresence?.find(
                (a) => a.userId === userData!._id
            );

            if (!roomPresence || !myPresence) {
                const personalAmount = Math.round(
                    (inv.amount || 0) / (inv.applyTo.length || 1) -
                        userPaidAmount
                );

                return {
                    ...inv,
                    personalAmount,
                    isPaidByMe: inv.payInfo?.some(
                        (p) =>
                            p.paidBy === userData!._id &&
                            Math.round(p.amount) >= personalAmount
                    ),
                    myPayInfo: inv.payInfo?.find(
                        (p) => p.paidBy === userData!._id
                    ),
                };
            }

            const calculatePresentDays = (
                presence: IMonthPresence["presence"]
            ) =>
                presence.reduce(
                    (acc, availability) =>
                        acc +
                        (availability === PresenceStatus.PRESENT ||
                        availability === PresenceStatus.UNDETERMINED
                            ? 1
                            : 0),
                    0
                );

            const totalPresentDays = roomPresence.reduce(
                (acc, att) => acc + calculatePresentDays(att.presence),
                0
            );

            const costPerDay = inv.amount / totalPresentDays;

            const myPresentDays = calculatePresentDays(myPresence.presence);

            const personalAmount = Math.round(
                costPerDay * myPresentDays - userPaidAmount
            );

            return {
                ...inv,
                personalAmount,
                isPaidByMe: personalAmount <= 0,
                myPayInfo: inv.payInfo?.find((p) => p.paidBy === userData!._id),
            };
        });
    }, [pendingInvoicesQuery.data, monthsPresenceQuery.data, roommates]);

    const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
    const [selectedInvoiceToPay, setSelectedInvoiceToPay] =
        useState<PersonalInvoice | null>(null);

    const openInvoiceCheckoutDialog = (invoice: PersonalInvoice) => {
        console.log("Opening checkout dialog for invoice", invoice);
        setSelectedInvoiceToPay(invoice);
        setIsCheckoutDialogOpen(true);
    };

    const [addInvoiceType, setAddInvoiceType] = useState<
        IInvoice["type"] | null
    >(null);

    const [editingInvoice, setEditingInvoice] = useState<IInvoice | null>(null);

    return (
        <InvoicesContext.Provider
            value={{
                pendingInvoicesQuery,
                monthlyInvoices,
                otherInvoices,
                openInvoiceCheckoutDialog,
                addInvoiceType,
                setAddInvoiceType,
                editingInvoice,
                setEditingInvoice,
            }}
        >
            {children}
            <InvoiceCheckoutDialog
                open={isCheckoutDialogOpen}
                invoice={selectedInvoiceToPay}
                onOpenChange={setIsCheckoutDialogOpen}
            />
            <InvoiceDialog />
        </InvoicesContext.Provider>
    );
};

export const useInvoices = () => useContext(InvoicesContext);
