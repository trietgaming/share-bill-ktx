
import { createContext, useContext, useMemo, useState } from "react";
import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { useRoomQuery, useRoommatesQuery } from "./room-context";
import { IInvoice, PersonalInvoice } from "@/types/invoice";
import { queryClient } from "@/lib/query-client";
import { getInvoicesByRoom } from "@/lib/actions/invoice";
import { getRoomMonthsAttendance } from "@/lib/actions/month-attendance";
import { IMonthAttendance } from "@/types/month-attendance";
import { InvoiceCheckoutDialog } from "./invoice-checkout-dialog";

interface InvoicesContextType {
    pendingInvoicesQuery: UseQueryResult<IInvoice[], Error>;
    /** Personal amount must be calculated using attendance info */
    monthlyInvoices: PersonalInvoice[],
    otherInvoices: PersonalInvoice[],
    openInvoiceCheckoutDialog: (invoice: PersonalInvoice) => void,
}

const InvoicesContext = createContext<InvoicesContextType>({} as InvoicesContextType);

export const InvoicesProvider = ({ children }: { children: any }) => {
    const { userData } = useAuth();
    const { data: room } = useRoomQuery();
    const { data: roommates } = useRoommatesQuery();


    const pendingInvoicesQuery = useQuery<IInvoice[]>({
        queryKey: ["invoices", room._id],
        queryFn: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance", room._id] });
            return getInvoicesByRoom(room._id)
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });


    const monthsAttendanceQuery = useQuery({
        queryKey: ["attendance", room._id],
        queryFn: async () => {
            const months = pendingInvoicesQuery.data
                ?.filter(inv => inv.type === "walec" || inv.type === "roomCost")
                .map(inv => inv.monthApplied!)
                .filter((v, i, a) => a.indexOf(v) === i) // unique

            if (!months || months.length === 0) return [];

            const monthsAttendance = await getRoomMonthsAttendance(room._id, months);
            return monthsAttendance;
        },
        enabled: !!pendingInvoicesQuery.data,
        staleTime: 1000 * 60 * 60, // 1 hour
    })

    const otherInvoices = useMemo<PersonalInvoice[]>(() => {
        if (!pendingInvoicesQuery.data) return [];

        return pendingInvoicesQuery.data.filter(
            inv => inv.type === "other" && inv.applyTo.includes(userData!._id)
        ).map(inv => {
            const userPaidAmount = inv.payInfo?.filter(p => p.paidBy === userData!._id).reduce((sum, p) => sum + p.amount, 0) || 0;
            const personalAmount = Math.round((inv.amount || 0) / (inv.applyTo.length || 1) - userPaidAmount)
            return {
                ...inv,
                personalAmount,
                isPaidByMe: personalAmount <= 0,
                myPayInfo: inv.payInfo?.find(p => p.paidBy === userData!._id)
            }
        });

    }, [pendingInvoicesQuery.data]);

    const monthlyInvoices = useMemo(() => {
        if (!pendingInvoicesQuery.data || !monthsAttendanceQuery.data || !roommates) return [];

        const monthlyInvoices = pendingInvoicesQuery.data.filter(
            inv => (inv.type === "walec" || inv.type === "roomCost") && inv.applyTo.includes(userData!._id)
        );

        const roomAttendanceMap: Record<string, IMonthAttendance[]> = {};
        monthlyInvoices.forEach(inv => {
            if (!inv.monthApplied) return;
            const roomMonthAttendance = monthsAttendanceQuery.data.filter(a => a.month === inv.monthApplied);
            if (roomMonthAttendance.length < roommates.length) {
                const existingUserIds = roomMonthAttendance.map(a => a.userId);
                const missingRoommates = roommates.filter(r => !existingUserIds.includes(r.userId));
                missingRoommates.forEach(r => {
                    roomMonthAttendance.push({
                        month: inv.monthApplied!,
                        roomId: room._id,
                        userId: r.userId,
                        attendance: Array(31).fill("undetermined"),
                    });
                });
            }
            roomAttendanceMap[inv.monthApplied] = roomMonthAttendance;
        });

        return monthlyInvoices.map(inv => {
            const userPaidAmount = inv.payInfo?.filter(p => p.paidBy === userData!._id).reduce((sum, p) => sum + p.amount, 0) || 0;
            const roomAttendance = roomAttendanceMap[inv.monthApplied!];
            const myAttendance = roomAttendance?.find(a => a.userId === userData!._id);

            if (!roomAttendance || !myAttendance) {
                const personalAmount = Math.round((inv.amount || 0) / (inv.applyTo.length || 1) - userPaidAmount);

                return {
                    ...inv,
                    personalAmount,
                    isPaidByMe: inv.payInfo?.some(p => p.paidBy === userData!._id && Math.round(p.amount) >= personalAmount),
                    myPayInfo: inv.payInfo?.find(p => p.paidBy === userData!._id)
                };
            }

            const calculatePresentDays =
                (attendance: IMonthAttendance["attendance"]) =>
                (attendance.reduce((acc, availability) =>
                    acc + (availability === "present" || availability === "undetermined" ? 1 : 0)
                    , 0))

            const totalPresentDays = roomAttendance.reduce(
                (acc, att) => acc + (calculatePresentDays(att.attendance)), 0
            );

            const costPerDay = inv.amount / totalPresentDays;

            const myPresentDays = calculatePresentDays(myAttendance.attendance);

            const personalAmount = Math.round(costPerDay * myPresentDays - userPaidAmount);

            return {
                ...inv,
                personalAmount,
                isPaidByMe: personalAmount <= 0,
                myPayInfo: inv.payInfo?.find(p => p.paidBy === userData!._id)
            }
        });
    }, [pendingInvoicesQuery.data, monthsAttendanceQuery.data, roommates]);

    const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
    const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<PersonalInvoice | null>(null);

    const openInvoiceCheckoutDialog = (invoice: PersonalInvoice) => {
        console.log("Opening checkout dialog for invoice", invoice);
        setSelectedInvoiceToPay(invoice);
        setIsCheckoutDialogOpen(true);
    }

    return <InvoicesContext.Provider value={{
        pendingInvoicesQuery,
        monthlyInvoices,
        otherInvoices,
        openInvoiceCheckoutDialog
    }}>
        {children}
        <InvoiceCheckoutDialog open={isCheckoutDialogOpen} invoice={selectedInvoiceToPay} onOpenChange={setIsCheckoutDialogOpen} />
    </InvoicesContext.Provider>
}

export const useInvoices = () => useContext(InvoicesContext);