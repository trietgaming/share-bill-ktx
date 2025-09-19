"use client";
import { getRoomById, getRoommates } from "@/lib/actions/room";
import { IRoom } from "@/types/room";
import { Roommate } from "@/types/roommate";
import { createContext, useCallback, useContext, useMemo } from "react";
import { DefinedUseQueryResult, useQuery, UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { IClientMembership } from "@/types/membership";
import { getRoomMonthPresence } from "@/lib/actions/month-presence";
import { IMonthPresence } from "@/types/month-presence";
import { toYYYYMM } from "@/lib/utils";
import { InvoicesProvider } from "./invoices-context";
import { handleAction } from "@/lib/action-handler";

interface RoomProviderProps {
    children: any;
    initialRoom: IRoom;
}

interface RoomContextType {
    roomQuery: DefinedUseQueryResult<IRoom, Error>;
    roommatesQuery: UseQueryResult<Roommate[], Error>;
    membership?: IClientMembership,
    useMonthPresenceQuery: (month?: string | undefined | Date) => UseQueryResult<IMonthPresence[], Error>,
    /** Personal amount must be calculated using presence info */
}

const RoomContext = createContext<RoomContextType>({} as RoomContextType);

export const RoomProvider = ({ children, initialRoom }: RoomProviderProps) => {
    const { userData } = useAuth();

    const roomQuery = useQuery<IRoom>({
        queryKey: ["room", initialRoom._id],
        queryFn: () => handleAction(getRoomById(initialRoom._id)),
        initialData: initialRoom,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    const roommatesQuery = useQuery<Roommate[]>({
        queryKey: ["roommates", initialRoom._id],
        queryFn: () => handleAction(getRoommates(initialRoom._id)),
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    const useMonthPresenceQuery = useCallback((month?: string | Date) => {
        if (!month) month = toYYYYMM(new Date());
        if (month instanceof Date) month = toYYYYMM(month);

        return useQuery<IMonthPresence[]>({
            queryKey: ["presence", initialRoom._id, month],
            queryFn: () => handleAction(getRoomMonthPresence(initialRoom._id, month)),
            staleTime: 1000 * 60 * 60, // 1 hour
        });
    }, [initialRoom]);


    const membership = useMemo<IClientMembership | undefined>(() => {
        const me = roommatesQuery.data?.find(r => r.userId === userData?._id);

        if (!me) return void 0;

        return {
            joinedAt: me.joinedAt,
            role: me.role
        }
    }, [roommatesQuery.data, userData]);

    return (
        <RoomContext.Provider value={{
            roomQuery: roomQuery,
            roommatesQuery: roommatesQuery,
            membership,
            useMonthPresenceQuery,
        }}>
            <InvoicesProvider>
                {children}
            </InvoicesProvider>
        </RoomContext.Provider>
    );
};

// For further optimization
export const useRoomQuery = () => useContext(RoomContext).roomQuery;
export const useRoommatesQuery = () => useContext(RoomContext).roommatesQuery;
export { useInvoices } from "./invoices-context";
export const useMembership = () => useContext(RoomContext).membership;
export const useMonthPresenceQuery = (month?: string | Date) => useContext(RoomContext).useMonthPresenceQuery(month);
