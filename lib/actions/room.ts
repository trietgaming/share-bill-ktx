"use server";

import { Room } from "@/models/Room";
import { getAuthenticatedUser } from "../firebase/server";
import { redirectToLoginPage } from "../redirect-to-login";
import mongoose, { HydratedDocument } from "mongoose";
import { UserData } from "@/models/UserData";
import { Roommate } from "@/types/Roommate";
import { Membership } from "@/models/Membership";
import { getAuthenticatedUserData } from "./user-data";
import { IUserData } from "@/types/UserData";
import { getUserData } from "@/lib/user-data";
import { IRoom } from "@/types/Room";
import { serializeDocument } from "@/lib/serializer";

export async function createNewRoom(data: { name: string; maxMembers: number }) {
    const user = await getAuthenticatedUser();

    if (!user) {
        return redirectToLoginPage();
    }

    // Create the new room
    const session = await mongoose.startSession();
    const newRoom = await session.withTransaction(async () => {
        const newRoom = await Room.create({
            name: data.name,
            maxMembers: data.maxMembers,
            members: [user.uid],
        })

        await Membership.create({
            user: user.uid,
            room: newRoom._id,
            joinedAt: new Date(),
            role: 'admin'
        })

        await UserData.findByIdAndUpdate(user.uid, {
            $push: {
                roomsJoined: newRoom._id
            }
        })

        return newRoom;
    })

    return newRoom._id.toString();
}

export async function joinRoom(roomId: string): Promise<boolean> {
    const user = await getAuthenticatedUser();

    if (!user) {
        return redirectToLoginPage();
    }

    // TODO: check permission to join the room

    const targetRoom = await Room.findById(roomId);

    if (!targetRoom) {
        throw new Error("Phòng không tồn tại");
    }

    if (targetRoom.members.length >= targetRoom.maxMembers) {
        throw new Error("Phòng đã đầy");
    }

    if (targetRoom.members.includes(user.uid)) {
        return true; // Already a member
    }

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
        targetRoom.members.push(user.uid);
        await targetRoom.save();

        await Membership.create({
            user: user.uid,
            room: targetRoom._id,
            joinedAt: new Date(),
            role: 'member'
        })

        await UserData.findByIdAndUpdate(user.uid, {
            $push: {
                roomsJoined: targetRoom._id
            }
        })
    })

    return true;
}

export async function deleteRoom(roomId: string): Promise<void> {
    const user = await getAuthenticatedUser();

    if (!user) {
        return redirectToLoginPage();
    }

    const membership = await Membership.findOne({ room: roomId, user: user.uid });

    if (!membership) {
        throw new Error("Phòng không tồn tại hoặc bạn không phải thành viên của phòng");
    }

    if (membership.role !== 'admin') {
        throw new Error("Bạn không có quyền xóa phòng này");
    }

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
        // Delete all memberships related to the room
        await Membership.deleteMany({ room: roomId });

        // Remove the room from all users' roomsJoined
        await UserData.updateMany(
            { roomsJoined: roomId },
            { $pull: { roomsJoined: roomId } }
        );

        // Finally, delete the room
        await Room.findByIdAndDelete(roomId);
    });
}

/**
 * @param roomId The ID of the room to get roommates for
 * @returns Roommates in the room including the caller himself
 */
export async function getRoommates(roomId: string): Promise<Roommate[]> {
    const userData = await getAuthenticatedUserData();
    if (!userData) {
        return redirectToLoginPage();
    }

    const memberships = await Membership.find({ room: roomId }).populate<{ user: IUserData }>("user").lean();

    return memberships.map(m => ({
        userId: m.user._id,
        displayName: m.user.displayName,
        photoUrl: m.user.photoURL,
        email: m.user.email,
        joinedAt: m.joinedAt,
        role: m.role
    }));
}

export async function getUserRooms() {
    const user = await getAuthenticatedUser();
    if (!user) {
        return redirectToLoginPage();
    }
    const userData = await getUserData(user);
    const populatedUserData = await userData.populate<{ roomsJoined: HydratedDocument<IRoom>[] }>("roomsJoined");

    return serializeDocument<IRoom[]>(populatedUserData.roomsJoined);
};