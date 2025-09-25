import { handleAction } from "@/lib/action-handler";
import { getRoommates } from "@/lib/actions/room";
import { roommatesQueryKey } from "@/lib/query-client";
import { IClientMembership } from "@/types/membership";
import { Roommate } from "@/types/roommate";
import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState } from "react";
import { useRoomQuery } from "./room-context";
import { useAuth } from "@/components/auth-context";
import { RoommateInfoDialog } from "../roommate-dialog";

interface RoommatesContextType {
    roommatesQuery: UseQueryResult<Roommate[], Error>;
    membership?: IClientMembership;
    setInspectingRoommate: React.Dispatch<React.SetStateAction<Roommate | null>>;
}

const RoommatesContext = createContext<RoommatesContextType>(null as any);

export const RoommatesProvider = ({ children }: { children: any }) => {
    const { data: room } = useRoomQuery();
    const { userData } = useAuth();

    const [inspectingRoommate, setInspectingRoommate] = useState<Roommate | null>(null);

    const roommatesQuery = useQuery<Roommate[]>({
        queryKey: roommatesQueryKey(room._id),
        queryFn: () => handleAction(getRoommates(room._id)),
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    const membership = useMemo<IClientMembership | undefined>(() => {
        console.log(roommatesQuery.data);
        if (roommatesQuery.isLoading) return void 0;
        const me = roommatesQuery.data?.find((r) => r.userId === userData?._id);

        if (!me) return void 0;

        return {
            joinedAt: me.joinedAt,
            role: me.role,
        };
    }, [roommatesQuery.data, userData]);

    return (
        <RoommatesContext.Provider value={{
            roommatesQuery,
            membership,
            setInspectingRoommate,
        }}>
            {children}
            <RoommateInfoDialog roommate={inspectingRoommate} onOpenChange={() => setInspectingRoommate(null)} />
        </RoommatesContext.Provider>
    );
};

export const useRoommates = () => {
    const context = useContext(RoommatesContext);
    if (!context) {
        throw new Error("useRoommates must be used within a RoommatesProvider");
    }
    return context;
}
