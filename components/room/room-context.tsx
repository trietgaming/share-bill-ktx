"use client";
import { getRoommates } from "@/lib/actions/room";
import { IRoom } from "@/types/Room";
import { Roommate } from "@/types/Roommate";
import { createContext, useContext, useState } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";

interface RoomProviderProps {
    children: any;
    initialRoom: IRoom;
}

interface RoomContextType {
    room: IRoom;
    roommates: UseQueryResult<Roommate[], Error>
}

const RoomContext = createContext<RoomContextType>({} as RoomContextType);

export const RoomProvider = ({ children, initialRoom }: RoomProviderProps) => {
    const [room, setRoom] = useState<IRoom>(initialRoom);
    
    const roomatesQuery = useQuery<Roommate[]>({
        queryKey: ["roomates", room._id],
        queryFn: () => getRoommates(room._id)
    })

    return (
        <RoomContext.Provider value={{ room, roommates: roomatesQuery }}>{children}</RoomContext.Provider>
    );
};

// For further optimization
export const useRoom = () => useContext(RoomContext).room;
export const useRoommates = () => useContext(RoomContext).roommates;
