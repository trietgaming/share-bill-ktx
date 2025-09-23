"use server";

import { Room } from "@/models/Room";
import mongoose, { HydratedDocument } from "mongoose";
import { UserData } from "@/models/UserData";
import { Roommate } from "@/types/roommate";
import { Membership } from "@/models/Membership";
import { IUserData } from "@/types/user-data";
import { getUserData } from "@/lib/user-data";
import { IRoom } from "@/types/room";
import { serializeDocument } from "@/lib/serializer";
import { authenticate } from "../prechecks/auth";
import { IMembership } from "@/types/membership";
import { Invoice } from "@/models/Invoice";
import { MonthPresence } from "@/models/MonthPresence";
import {
    createErrorResponse,
    createSuccessResponse,
    handleServerActionError,
} from "@/lib/actions-helper";
import { ServerActionResponse } from "@/types/actions";
import { ErrorCode } from "@/enums/error";
import { verifyMembership, verifyRoomPermission } from "../prechecks/room";
import { hasPermission, isRolePrecedent } from "../permission";
import { MemberRole } from "@/enums/member-role";
import {
    sendNotificationToKickedMember,
    sendRoomLeftNotification,
    sendRoomDeletedNotification,
    sendRoomJoinedNotification,
} from "@/lib/messages/room";
import { IClientBankAccount } from "@/types/bank-account";

export async function createNewRoom(data: {
    name: string;
    maxMembers: number;
    isPrivate: boolean;
}): ServerActionResponse<string> {
    const user = await authenticate();

    // Create the new room
    try {
        const session = await mongoose.startSession();
        const newRoom = await session.withTransaction(async () => {
            const newRoom = new Room({
                name: data.name,
                maxMembers: data.maxMembers,
                members: [user.uid],
                isPrivate: data.isPrivate,
            });

            await newRoom.save({ session });

            await new Membership({
                user: user.uid,
                room: newRoom._id,
                joinedAt: new Date(),
                role: "admin",
            }).save({ session });

            await UserData.findByIdAndUpdate(
                user.uid,
                {
                    $push: {
                        roomsJoined: newRoom._id,
                    },
                },
                { session, runValidators: true }
            );

            return newRoom;
        });

        return createSuccessResponse(newRoom._id.toString());
    } catch (err) {
        return handleServerActionError(err);
    }
}

export async function joinRoom(
    roomId: string,
    token?: string | null
): ServerActionResponse<boolean> {
    const user = await authenticate();

    // TODO: check permission to join the room

    const targetRoom = await Room.findById(roomId);

    if (!targetRoom) {
        return createErrorResponse("Phòng không tồn tại", ErrorCode.NOT_FOUND);
    }

    if (targetRoom.members.length >= targetRoom.maxMembers) {
        return createErrorResponse("Phòng đã đầy", ErrorCode.FORBIDDEN);
    }

    if (targetRoom.members.includes(user.uid)) {
        return createSuccessResponse(true);
    }

    if (targetRoom.isPrivate && token !== targetRoom.inviteToken) {
        return createErrorResponse(
            "Phòng riêng tư yêu cầu liên kết mời hợp lệ",
            ErrorCode.FORBIDDEN
        );
    }

    try {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            targetRoom.members.push(user.uid);
            await targetRoom.save({ session });

            await new Membership({
                user: user.uid,
                room: targetRoom._id,
                joinedAt: new Date(),
                role: "member",
            }).save({ session });

            await UserData.findByIdAndUpdate(
                user.uid,
                {
                    $push: {
                        roomsJoined: targetRoom._id,
                    },
                },
                { session, runValidators: true }
            );
        });
    } catch (error) {
        return handleServerActionError(error);
    }

    sendRoomJoinedNotification(roomId, user.uid);

    return createSuccessResponse(true);
}

export async function deleteRoom(roomId: string): ServerActionResponse<void> {
    const user = await authenticate();

    const [membership, error] = await verifyMembership(user.uid, roomId);
    if (error) return createErrorResponse(error);

    if (membership.role !== MemberRole.ADMIN) {
        return createErrorResponse(
            "Bạn không có quyền xóa phòng này",
            ErrorCode.FORBIDDEN
        );
    }

    try {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            // Delete all memberships related to the room
            await Membership.deleteMany({ room: roomId }, { session });

            // Delete all invoices related to the room
            await Invoice.deleteMany({ roomId: roomId }, { session });

            // Delete all month presences related to the room
            await MonthPresence.deleteMany({ roomId: roomId }, { session });

            // Remove the room from all users' roomsJoined
            await UserData.updateMany(
                { roomsJoined: roomId },
                { $pull: { roomsJoined: roomId } },
                { session, runValidators: true }
            );

            // Finally, delete the room
            await Room.findByIdAndDelete(roomId, { session });
        });
    } catch (error) {
        return handleServerActionError(error);
    }

    sendRoomDeletedNotification(user.uid, roomId);
    return createSuccessResponse(void 0);
}

export async function leaveRoom(roomId: string): ServerActionResponse<void> {
    const user = await authenticate();

    const [membership, error] = await verifyMembership(user.uid, roomId);
    if (error) return createErrorResponse(error);

    if (membership.role === "admin") {
        return createErrorResponse(
            "Quản trị viên không thể rời phòng. Vui lòng chuyển quyền quản trị hoặc xóa phòng.",
            ErrorCode.FORBIDDEN
        );
    }

    const pendingInvoice = await Invoice.findOne({
        roomId: roomId,
        applyTo: user.uid,
        status: "pending",
    });

    if (pendingInvoice) {
        return createErrorResponse(
            "Bạn có hóa đơn chưa thanh toán trong phòng này. Vui lòng giải quyết trước khi rời phòng.",
            ErrorCode.FORBIDDEN
        );
    }

    try {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            // Remove membership
            await Membership.deleteOne(
                { room: roomId, user: user.uid },
                { session }
            );

            // Remove user's presence records in the room
            await MonthPresence.deleteMany(
                { roomId: roomId, userId: user.uid },
                { session }
            );

            // Remove the user from the room's members
            await Room.findByIdAndUpdate(
                roomId,
                {
                    $pull: { members: user.uid },
                },
                { session, runValidators: true }
            );

            // Remove the room from user's roomsJoined
            await UserData.findByIdAndUpdate(
                user.uid,
                {
                    $pull: { roomsJoined: roomId },
                },
                { session, runValidators: true }
            );
        });
    } catch (error) {
        return handleServerActionError(error);
    }

    sendRoomLeftNotification(roomId, user.uid);
    return createSuccessResponse(void 0);
}

/**
 * @param roomId The ID of the room to get roommates for
 * @returns Roommates in the room including the caller himself
 */
export async function getRoommates(
    roomId: string
): ServerActionResponse<Roommate[]> {
    const user = await authenticate();
    const userData = await getUserData(user);

    if (!userData.roomsJoined.includes(roomId)) {
        return createErrorResponse(
            "Bạn không phải thành viên của phòng này",
            ErrorCode.NOT_FOUND
        );
    }

    const memberships = await Membership.find({ room: roomId }).populate<{
        user: Omit<IUserData, "bankAccounts"> & {
            bankAccounts: IClientBankAccount[];
        };
    }>({
        path: "user",
        populate: { path: "bankAccounts" },
    });

    const roommates = memberships
        .map(
            serializeDocument<
                Omit<IMembership, "user"> & {
                    user: Omit<IUserData, "bankAccounts"> & {
                        bankAccounts: IClientBankAccount[];
                    };
                }
            >
        )
        .map((m) => ({
            userId: m.user._id,
            displayName: m.user.displayName,
            photoUrl: m.user.photoURL,
            email: m.user.email,
            joinedAt: m.joinedAt,
            role: m.role,
            bankAccounts: m.user.bankAccounts,
        }));

    return createSuccessResponse(roommates);
}

export async function getUserRooms(): ServerActionResponse<IRoom[]> {
    const user = await authenticate();

    const userData = await getUserData(user);
    const populatedUserData = await userData.populate<{
        roomsJoined: HydratedDocument<IRoom>[];
    }>("roomsJoined");

    return createSuccessResponse(
        serializeDocument<IRoom[]>(populatedUserData.roomsJoined)
    );
}

export async function getRoomById(roomId: string): ServerActionResponse<IRoom> {
    const user = await authenticate();

    if (!roomId) {
        return createErrorResponse(
            "Bạn cần cung cấp ID phòng",
            ErrorCode.INVALID_INPUT
        );
    }

    const membership = await Membership.findOne({
        room: roomId,
        user: user.uid,
    })
        .populate<{ room: IRoom }>("room")
        .lean();

    if (!membership) {
        return createErrorResponse(
            "Phòng không tồn tại hoặc bạn không phải thành viên của phòng",
            ErrorCode.NOT_FOUND
        );
    }

    return createSuccessResponse(membership.room);
}

export async function kickMember(
    roomId: string,
    memberId: string
): ServerActionResponse<void> {
    const user = await authenticate();
    if (user.uid === memberId) {
        return createErrorResponse(
            "Bạn không thể tự xóa mình ra khỏi phòng",
            ErrorCode.FORBIDDEN
        );
    }

    const [membership, error] = await verifyMembership(user.uid, roomId);
    if (error) return createErrorResponse(error);

    const membershipToRemove = await Membership.findOne({
        room: roomId,
        user: memberId,
    }).populate<{ user: IUserData }>("user");

    if (!membershipToRemove) {
        return createErrorResponse(
            "Thành viên không tồn tại trong phòng hoặc đã rời phòng",
            ErrorCode.NOT_FOUND
        );
    }

    if (
        !hasPermission("room.members.kick", membership.role) ||
        !isRolePrecedent(membership.role, membershipToRemove.role)
    ) {
        return createErrorResponse(
            "Bạn không có quyền thực hiện hành động này",
            ErrorCode.FORBIDDEN
        );
    }

    try {
        const session = await mongoose.startSession();

        await session.withTransaction(async () => {
            // Remove membership
            await Membership.deleteOne(
                { room: roomId, user: memberId },
                { session }
            );

            // Remove user's presence records in the room
            await MonthPresence.deleteMany(
                { roomId: roomId, userId: memberId },
                { session }
            );

            // Remove the user from the room's members
            await Room.findByIdAndUpdate(
                roomId,
                {
                    $pull: { members: memberId },
                },
                { session, runValidators: true }
            );

            // Remove the room from user's roomsJoined
            await UserData.findByIdAndUpdate(
                memberId,
                {
                    $pull: { roomsJoined: roomId },
                },
                { session, runValidators: true }
            );

            // Remove user from all pending invoices
            await Invoice.updateMany(
                { applyTo: memberId, roomId: roomId, status: "pending" },
                {
                    $pull: {
                        applyTo: memberId,
                    },
                },
                {
                    session,
                    runValidators: true,
                }
            );
        });
    } catch (err) {
        return handleServerActionError(err);
    }

    sendNotificationToKickedMember(memberId, roomId);
    sendRoomLeftNotification(roomId, memberId);
    return createSuccessResponse(void 0);
}

interface UpdateRoomFormData {
    name: string;
    maxMembers: number;
    isPrivate: boolean;
}

export async function updateRoomData(
    roomId: string,
    data: UpdateRoomFormData
): ServerActionResponse<void> {
    const user = await authenticate();

    const [membership, membershipError] = await verifyMembership(
        user.uid,
        roomId
    );

    if (membershipError) return createErrorResponse(membershipError);

    const [_, permissionError] = verifyRoomPermission(membership, [
        MemberRole.ADMIN,
        MemberRole.MODERATOR,
    ]);

    if (permissionError) return createErrorResponse(permissionError);

    if (!membership) {
        return createErrorResponse(
            "Bạn không có quyền sửa thông tin phòng",
            ErrorCode.FORBIDDEN
        );
    }

    const room = await Room.findById(roomId);
    if (!room) {
        return createErrorResponse("Phòng không tồn tại", ErrorCode.NOT_FOUND);
    }

    Object.assign(room, data);

    try {
        await room.save();
    } catch (error) {
        return handleServerActionError(error);
    }

    // TODO: send notification to room members about the update
    return createSuccessResponse(void 0);
}

export async function updateUserRole(
    roomId: string,
    memberId: string,
    targetRole: MemberRole
): ServerActionResponse<void> {
    if (
        targetRole !== MemberRole.MODERATOR &&
        targetRole !== MemberRole.MEMBER
    ) {
        return createErrorResponse(
            "Bạn không có quyền thay đổi vai trò này",
            ErrorCode.FORBIDDEN
        );
    }

    const user = await authenticate();

    const [membership, membershipError] = await verifyMembership(
        user.uid,
        roomId
    );
    if (membershipError) return createErrorResponse(membershipError);

    const [targetMembership, targetMembershipError] = await verifyMembership(
        memberId,
        roomId
    );
    if (targetMembershipError)
        return createErrorResponse(targetMembershipError);

    const [, permissionError] = verifyRoomPermission(membership, [
        MemberRole.ADMIN,
    ]);

    if (permissionError) return createErrorResponse(permissionError);

    targetMembership.role = targetRole;
    
    try {
        await targetMembership.save();
    } catch (error) {
        return handleServerActionError(error);
    }

    // TODO: send notification to room members about the update

    return createSuccessResponse(void 0);
}
