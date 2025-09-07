"use server";

import { Room } from "@/models/Room";
import { getAuthenticatedUser } from "../firebase/server";
import { redirectToLoginPage } from "../redirect-to-login";
import mongoose from "mongoose";
import { UserData } from "@/models/UserData";

export async function createNewRoom(data: { name: string; maxMembers: number }) {
    const user = await getAuthenticatedUser();

    if (!user) {
        return redirectToLoginPage();
    }

    // Create the new room
    const session = await mongoose.startSession();
    const newRoom = await session.withTransaction(async () => {
        const newRoom = new Room({
            name: data.name,
            maxMembers: data.maxMembers,
            members: [{
                userData: user.uid,
                joinedAt: new Date(),
                role: 'admin'
            }]
        })

        await newRoom.save();

        await UserData.findByIdAndUpdate(user.uid, {
            $push: {
                roomsJoined: {
                    room: newRoom._id,
                    joinedAt: new Date(),
                    role: 'admin'
                }
            }
        })

        return newRoom;
    })

    return newRoom._id.toString();
}