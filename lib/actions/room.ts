"use server";

import { Room } from "@/models/Room";
import mongoose, { HydratedDocument } from "mongoose";
import { UserData } from "@/models/UserData";
import { Roommate } from "@/types/roommate";
import { Membership } from "@/models/Membership";
import { IUserData, IUserDataWithBankAccounts } from "@/types/user-data";
import { getUserData } from "@/lib/user-data";
import { IRoom } from "@/types/room";
import { serializeDocument } from "@/lib/serializer";
import { authenticate } from "../prechecks/auth";
import { IBankAccount, IClientBankAccount } from "@/types/bank-account";
import { IMembership } from "@/types/membership";
import { AppError } from "../errors";
import { Invoice } from "@/models/Invoice";
import { MonthAttendance } from "@/models/MonthAttendance";

export async function createNewRoom(data: { name: string; maxMembers: number }) {
    const user = await authenticate();

    // Create the new room
    const session = await mongoose.startSession();
    const newRoom = await session.withTransaction(async () => {
        const newRoom = new Room({
            name: data.name,
            maxMembers: data.maxMembers,
            members: [user.uid],
        });

        await newRoom.save({ session });

        await new Membership({
            user: user.uid,
            room: newRoom._id,
            joinedAt: new Date(),
            role: 'admin'
        }).save({ session });

        await UserData.findByIdAndUpdate(user.uid, {
            $push: {
                roomsJoined: newRoom._id
            }
        }, { session, runValidators: true });

        return newRoom;
    })

    return newRoom._id.toString();
}

export async function joinRoom(roomId: string): Promise<boolean> {
    const user = await authenticate();

    // TODO: check permission to join the room

    const targetRoom = await Room.findById(roomId);

    if (!targetRoom) {
        throw new AppError("Phòng không tồn tại");
    }

    if (targetRoom.members.length >= targetRoom.maxMembers) {
        throw new AppError("Phòng đã đầy");
    }

    if (targetRoom.members.includes(user.uid)) {
        return true; // Already a member
    }

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
        targetRoom.members.push(user.uid);
        await targetRoom.save({ session });

        await new Membership({
            user: user.uid,
            room: targetRoom._id,
            joinedAt: new Date(),
            role: 'member'
        }).save({ session });

        await UserData.findByIdAndUpdate(user.uid, {
            $push: {
                roomsJoined: targetRoom._id
            }
        }, { session, runValidators: true });
    })

    return true;
}

export async function deleteRoom(roomId: string): Promise<void> {
    const user = await authenticate();

    const membership = await Membership.findOne({ room: roomId, user: user.uid });

    if (!membership) {
        throw new AppError("Phòng không tồn tại hoặc bạn không phải thành viên của phòng");
    }

    if (membership.role !== 'admin') {
        throw new AppError("Bạn không có quyền xóa phòng này");
    }

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
        // Delete all memberships related to the room
        await Membership.deleteMany({ room: roomId }, { session });

        // Delete all invoices related to the room
        await Invoice.deleteMany({ roomId: roomId }, { session });

        // Delete all month attendances related to the room
        await MonthAttendance.deleteMany({ roomId: roomId }, { session });

        // Remove the room from all users' roomsJoined
        await UserData.updateMany(
            { roomsJoined: roomId },
            { $pull: { roomsJoined: roomId } }, { session, runValidators: true }
        );

        // Finally, delete the room
        await Room.findByIdAndDelete(roomId, { session });
    });
}

export async function leaveRoom(roomId: string): Promise<void> {
    const user = await authenticate();

    const membership = await Membership.findOne({ room: roomId, user: user.uid });

    if (!membership) {
        throw new AppError("Phòng không tồn tại hoặc bạn không phải thành viên của phòng");
    }

    if (membership.role === 'admin') {
        throw new AppError("Quản trị viên không thể rời phòng. Vui lòng chuyển quyền quản trị hoặc xóa phòng.");
    }

    const pendingInvoice = await Invoice.findOne({ roomId: roomId, applyTo: user.uid, status: 'pending' });

    if (pendingInvoice) {
        throw new AppError("Bạn có hóa đơn chưa thanh toán trong phòng này. Vui lòng giải quyết trước khi rời phòng.");
    }

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
        // Remove membership
        await Membership.deleteOne({ room: roomId, user: user.uid }, { session });

        // Remove user's attendance records in the room
        await MonthAttendance.deleteMany({ roomId: roomId, userId: user.uid }, { session });

        // Remove the user from the room's members
        await Room.findByIdAndUpdate(roomId, {
            $pull: { members: user.uid }
        }, { session, runValidators: true });

        // Remove the room from user's roomsJoined
        await UserData.findByIdAndUpdate(user.uid, {
            $pull: { roomsJoined: roomId }
        }, { session, runValidators: true });
    });
}

/**
 * @param roomId The ID of the room to get roommates for
 * @returns Roommates in the room including the caller himself
 */
export async function getRoommates(roomId: string): Promise<Roommate[]> {
    const user = await authenticate();
    const userData = await getUserData(user);

    if (!userData.roomsJoined.includes(roomId)) {
        throw new AppError("Bạn không phải thành viên của phòng này");
    }

    const memberships = await Membership.find({ room: roomId })
        .populate<{ user: Omit<IUserData, "bankAccounts"> & { bankAccounts: IClientBankAccount[] } }>({
            path: "user",
            populate: { path: "bankAccounts" }
        })

    return memberships.map(serializeDocument<
        Omit<IMembership, "user"> & { user: Omit<IUserData, "bankAccounts"> & { bankAccounts: IClientBankAccount[] } }
    >).map(m => ({
        userId: m.user._id,
        displayName: m.user.displayName,
        photoUrl: m.user.photoURL,
        email: m.user.email,
        joinedAt: m.joinedAt,
        role: m.role,
        bankAccounts: m.user.bankAccounts,
    }));
}

export async function getUserRooms() {
    const user = await authenticate();

    const userData = await getUserData(user);
    const populatedUserData = await userData.populate<{ roomsJoined: HydratedDocument<IRoom>[] }>("roomsJoined");

    return serializeDocument<IRoom[]>(populatedUserData.roomsJoined);
};

export async function getRoomById(roomId: string): Promise<IRoom> {
    const user = await authenticate();

    if (!roomId) {
        throw new AppError("Bạn cần cung cấp ID phòng");
    }

    const membership = await Membership.findOne({ room: roomId, user: user.uid }).populate<{ room: IRoom }>("room").lean();

    if (!membership) {
        throw new AppError("Phòng không tồn tại hoặc bạn không phải thành viên của phòng");
    }

    return membership.room;
}

export async function updateRoomData() {
    
}