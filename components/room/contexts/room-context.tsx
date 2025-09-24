"use client";
import { getRoomById } from "@/lib/actions/room";
import { IRoom } from "@/types/room";
import { createContext, useCallback, useContext } from "react";
import {
    DefinedUseQueryResult,
    useQuery,
    UseQueryResult,
} from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { getRoomMonthPresence } from "@/lib/actions/month-presence";
import { IMonthPresence } from "@/types/month-presence";
import { toYYYYMM } from "@/lib/utils";
import { InvoicesProvider } from "./invoices-context";
import { handleAction } from "@/lib/action-handler";
import { presenceQueryKey, roomQueryKey } from "@/lib/query-client";
import { RoommatesProvider } from "./roommates-context";

interface RoomProviderProps {
    children: any;
    initialRoom: IRoom;
}

interface RoomContextType {
    roomQuery: DefinedUseQueryResult<IRoom, Error>;
    useMonthPresenceQuery: (
        month?: string | undefined | Date
    ) => UseQueryResult<IMonthPresence[], Error>;
    /** Personal amount must be calculated using presence info */
}

const RoomContext = createContext<RoomContextType>({} as RoomContextType);

export const RoomProvider = ({ children, initialRoom }: RoomProviderProps) => {
    const { userData } = useAuth();

    const roomQuery = useQuery<IRoom>({
        queryKey: roomQueryKey(initialRoom._id),
        queryFn: () => handleAction(getRoomById(initialRoom._id)),
        initialData: initialRoom,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    const useMonthPresenceQuery = useCallback(
        (month?: string | Date) => {
            if (!month) month = toYYYYMM(new Date());
            if (month instanceof Date) month = toYYYYMM(month);

            return useQuery<IMonthPresence[]>({
                queryKey: presenceQueryKey(initialRoom._id, month),
                queryFn: () =>
                    handleAction(getRoomMonthPresence(initialRoom._id, month)),
                staleTime: 1000 * 60 * 60, // 1 hour
            });
        },
        [initialRoom]
    );

    return (
        <RoomContext.Provider
            value={{
                roomQuery: roomQuery,
                useMonthPresenceQuery,
            }}
        >
            <RoommatesProvider>
                <InvoicesProvider>{children}</InvoicesProvider>
            </RoommatesProvider>
        </RoomContext.Provider>
    );
};

// Compatibility exports
export { useInvoices } from "./invoices-context";
export { useRoommates } from "./roommates-context";

export const useRoomQuery = () => useContext(RoomContext).roomQuery;

// For further optimizations
export const useMonthPresenceQuery = (month?: string | Date) =>
    useContext(RoomContext).useMonthPresenceQuery(month);
