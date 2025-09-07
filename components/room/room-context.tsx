"use client";
import { IRoom } from "@/types/Room";
import { createContext, useContext } from "react";

interface RoomContextProps {
    children: any;
    room: IRoom;
}

interface RoomContextType {
    room: IRoom;
}

const RoomContext = createContext<RoomContextType>({
    room: {
        _id: "",
        name: "",
        members: [],
        maxMembers: 0
    }
});

export const RoomProvider = ({ children, room }: RoomContextProps) => {
    return (
        <RoomContext.Provider value={{ room }}>{children}</RoomContext.Provider>
    );
};

export const useRoom = () => useContext(RoomContext);
