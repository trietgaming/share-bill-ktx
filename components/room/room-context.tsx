"use client";
import { getRoomById, getRoommates } from "@/lib/actions/room";
import { IRoom } from "@/types/Room";
import { Roommate } from "@/types/Roommate";
import { createContext, useContext, useMemo } from "react";
import { DefinedUseQueryResult, useQuery, UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { IClientMembership } from "@/types/Membership";

interface RoomProviderProps {
    children: any;
    initialRoom: IRoom;
}

interface RoomContextType {
    roomQuery: DefinedUseQueryResult<IRoom, Error>;
    roommatesQuery: UseQueryResult<Roommate[], Error>;
    membership?: IClientMembership
}

const RoomContext = createContext<RoomContextType>({} as RoomContextType);

export const RoomProvider = ({ children, initialRoom }: RoomProviderProps) => {
    const { userData } = useAuth();

    const roomQuery = useQuery<IRoom>({
        queryKey: ["room", initialRoom._id],
        queryFn: () => getRoomById(initialRoom._id),
        initialData: initialRoom,
    });

    const roommatesQuery = useQuery<Roommate[]>({
        queryKey: ["roommates", initialRoom._id],
        queryFn: () => getRoommates(initialRoom._id)
    });

    const membership = useMemo<IClientMembership | undefined>(() => {
        const me = roommatesQuery.data?.find(r => r.userId === userData?._id);

        if (!me) return void 0;

        return {
            joinedAt: me.joinedAt,
            role: me.role
        }
    }, [roommatesQuery.data, userData]);

    return (
        <RoomContext.Provider value={{ roomQuery: roomQuery, roommatesQuery: roommatesQuery, membership }}>{children}</RoomContext.Provider>
    );
};

// For further optimization
export const useRoomQuery = () => useContext(RoomContext).roomQuery;
export const useRoommatesQuery = () => useContext(RoomContext).roommatesQuery;
export const useMembership = () => useContext(RoomContext).membership;
