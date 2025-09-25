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
import { _authenticate, authenticate, UserCtx } from "../prechecks/auth";
import { IMembership } from "@/types/membership";
import { Invoice } from "@/models/Invoice";
import { MonthPresence } from "@/models/MonthPresence";
import {
    createErrorResponse,
    createSuccessResponse,
    handleServerActionError,
    revalidateTags,
    serverAction,
} from "@/lib/actions-helper";
import { ServerActionResponse } from "@/types/actions";
import { ErrorCode } from "@/enums/error";
import {
    _verifyMembership,
    _verifyRoomPermission,
    verifyMembership,
    VerifyMembershipCtx,
    verifyRoomPermission,
    VerifyRoomPermissionCtx,
} from "../prechecks/room";
import { hasPermission, isRolePrecedent } from "../permission";
import { MemberRole } from "@/enums/member-role";
import {
    sendNotificationToKickedMember,
    sendRoomLeftNotification,
    sendRoomDeletedNotification,
    sendRoomJoinedNotification,
} from "@/lib/messages/room";
import { IClientBankAccount } from "@/types/bank-account";
import { AppError } from "../errors";
import { revalidateTag } from "next/cache";

export const createNewRoom = serverAction({
    fn: async function (
        ctx: UserCtx,
        data: {
            name: string;
            maxMembers: number;
            isPrivate: boolean;
        }
    ): Promise<string> {
        const user = ctx.user;
        // Create the new room
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

        revalidateTag(`user-rooms-${user.uid}`);
        return newRoom._id.toString();
    },
    prechecks: [_authenticate],
});

export const joinRoom = serverAction({
    fn: async function (
        ctx: UserCtx,
        roomId: string,
        token?: string | null
    ): Promise<boolean> {
        const targetRoom = await Room.findById(roomId);

        if (!targetRoom) {
            throw new AppError("Phòng không tồn tại", ErrorCode.NOT_FOUND);
        }

        if (targetRoom.members.length >= targetRoom.maxMembers) {
            throw new AppError("Phòng đã đầy", ErrorCode.FORBIDDEN);
        }

        if (targetRoom.members.includes(ctx.user.uid)) {
            return true;
        }

        if (targetRoom.isPrivate && token !== targetRoom.inviteToken) {
            throw new AppError(
                "Phòng riêng tư yêu cầu liên kết mời hợp lệ",
                ErrorCode.FORBIDDEN
            );
        }

        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            targetRoom.members.push(ctx.user.uid);
            await targetRoom.save({ session });

            await new Membership({
                user: ctx.user.uid,
                room: targetRoom._id,
                joinedAt: new Date(),
                role: "member",
            }).save({ session });

            await UserData.findByIdAndUpdate(
                ctx.user.uid,
                {
                    $push: {
                        roomsJoined: targetRoom._id,
                    },
                },
                { session, runValidators: true }
            );
        });

        await sendRoomJoinedNotification(roomId, ctx.user.uid);

        revalidateTag(`room-${roomId}`);
        targetRoom.members.forEach((memberId) => {
            revalidateTag(`user-rooms-${memberId}`);
        });

        return true;
    },
    prechecks: [_authenticate],
});

export const deleteRoom = serverAction({
    fn: async function (
        ctx: UserCtx & VerifyMembershipCtx,
        roomId: string
    ): Promise<void> {
        if (ctx.membership.role !== MemberRole.ADMIN) {
            throw new AppError(
                "Bạn không có quyền xóa phòng này",
                ErrorCode.FORBIDDEN
            );
        }

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
            const room = await Room.findByIdAndDelete(roomId, { session });
            console.log("deleted room", room);
            room?.members.forEach((memberId) =>
                revalidateTag(`user-rooms-${memberId}`)
            );
        });

        revalidateTag(`room-${roomId}`);
        await sendRoomDeletedNotification(ctx.user.uid, roomId);
        return void 0;
    },
    initContext(ctx, roomId) {
        ctx.roomId = roomId;
    },
    prechecks: [_authenticate, _verifyMembership],
});

export const leaveRoom = serverAction({
    fn: async function (
        ctx: VerifyMembershipCtx,
        roomId: string
    ): Promise<void> {
        if (ctx.membership.role === MemberRole.ADMIN) {
            throw new AppError(
                "Quản trị viên không thể rời phòng. Vui lòng chuyển quyền quản trị hoặc xóa phòng.",
                ErrorCode.FORBIDDEN
            );
        }

        const pendingInvoice = await Invoice.findOne({
            roomId: roomId,
            applyTo: ctx.user.uid,
            status: "pending",
        });

        if (pendingInvoice) {
            throw new AppError(
                "Bạn có hóa đơn chưa thanh toán trong phòng này. Vui lòng giải quyết trước khi rời phòng.",
                ErrorCode.FORBIDDEN
            );
        }

        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            // Remove membership
            await Membership.deleteOne(
                { room: roomId, user: ctx.user.uid },
                { session }
            );

            // Remove user's presence records in the room
            await MonthPresence.deleteMany(
                { roomId: roomId, userId: ctx.user.uid },
                { session }
            );

            // Remove the user from the room's members
            await Room.findByIdAndUpdate(
                roomId,
                {
                    $pull: { members: ctx.user.uid },
                },
                { session, runValidators: true }
            );

            // Remove the room from user's roomsJoined
            await UserData.findByIdAndUpdate(
                ctx.user.uid,
                {
                    $pull: { roomsJoined: roomId },
                },
                { session, runValidators: true }
            );
        });

        revalidateTag(`room-${roomId}`);
        revalidateTag(`user-rooms-${ctx.user.uid}`);

        await sendRoomLeftNotification(roomId, ctx.user.uid);
    },
    initContext(ctx, roomId) {
        ctx.roomId = roomId;
    },
    prechecks: [_authenticate, _verifyMembership],
});

/**
 * @param roomId The ID of the room to get roommates for
 * @returns Roommates in the room including the caller himself
 */
export const getRoommates = serverAction({
    fn: async function (ctx: UserCtx, roomId: string): Promise<Roommate[]> {
        const userData = await getUserData(ctx.user);

        if (!userData.roomsJoined.includes(roomId)) {
            throw new AppError(
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

        return roommates;
    },
    prechecks: [_authenticate],
    cache(ctx, roomId) {
        return {
            tags: [`room-${roomId}`, `roommates-${roomId}`],
        };
    },
});

export const getUserRooms = serverAction({
    fn: async function (
        ctx: UserCtx & { roomsJoined: IRoom[] }
    ): Promise<IRoom[]> {
        const userData = await getUserData(ctx.user);
        const populatedUserData = await userData.populate<{
            roomsJoined: HydratedDocument<IRoom>[];
        }>("roomsJoined");

        const roomsJoined = serializeDocument<IRoom[]>(
            populatedUserData.roomsJoined
        );

        return roomsJoined;
    },
    prechecks: [_authenticate],
    cache(ctx) {
        return {
            tags: [`user-rooms-${ctx.user.uid}`],
        };
    },
});

export const getRoomById = serverAction({
    fn: async function (ctx: UserCtx, roomId: string): Promise<IRoom> {
        if (!roomId) {
            throw new AppError(
                "Bạn cần cung cấp ID phòng",
                ErrorCode.INVALID_INPUT
            );
        }

        const membership = await Membership.findOne({
            room: roomId,
            user: ctx.user.uid,
        })
            .populate<{ room: IRoom }>("room")
            .lean();

        if (!membership) {
            throw new AppError(
                "Phòng không tồn tại hoặc bạn không phải thành viên của phòng",
                ErrorCode.NOT_FOUND
            );
        }

        return membership.room;
    },
    prechecks: [_authenticate],
    cache(ctx, roomId) {
        return {
            tags: [`room-${roomId}`],
        };
    },
});

export const kickMember = serverAction({
    fn: async function (
        ctx: VerifyMembershipCtx,
        roomId: string,
        memberId: string
    ): Promise<void> {
        if (ctx.user.uid === memberId) {
            throw new AppError(
                "Bạn không thể tự xóa mình ra khỏi phòng",
                ErrorCode.FORBIDDEN
            );
        }

        const membershipToRemove = await Membership.findOne({
            room: roomId,
            user: memberId,
        }).populate<{ user: IUserData }>("user");

        if (!membershipToRemove) {
            throw new AppError(
                "Thành viên không tồn tại trong phòng hoặc đã rời phòng",
                ErrorCode.NOT_FOUND
            );
        }

        if (
            !hasPermission("room.members.kick", ctx.membership.role) ||
            !isRolePrecedent(ctx.membership.role, membershipToRemove.role)
        ) {
            throw new AppError(
                "Bạn không có quyền thực hiện hành động này",
                ErrorCode.FORBIDDEN
            );
        }

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

        await sendNotificationToKickedMember(memberId, roomId);
        await sendRoomLeftNotification(roomId, memberId);

        revalidateTags([`room-${roomId}`, `user-rooms-${memberId}`]);
    },
    initContext(ctx, roomId) {
        ctx.roomId = roomId;
    },
    prechecks: [_authenticate, _verifyMembership],
});

interface UpdateRoomFormData {
    name: string;
    maxMembers: number;
    isPrivate: boolean;
}

export const updateRoomData = serverAction({
    fn: async function (
        ctx: VerifyRoomPermissionCtx,
        roomId: string,
        data: UpdateRoomFormData
    ): Promise<void> {
        const room = await Room.findById(roomId);
        if (!room) {
            throw new AppError("Phòng không tồn tại", ErrorCode.NOT_FOUND);
        }

        Object.assign(room, data);

        await room.save();

        revalidateTags([`room-${roomId}`, `user-rooms-${ctx.user.uid}`]);
        // TODO: send notification to room members about the update
        return void 0;
    },
    initContext(ctx, roomId) {
        ctx.roomId = roomId;
        ctx.requiredRoles = [MemberRole.ADMIN, MemberRole.MODERATOR];
    },
    prechecks: [_authenticate, _verifyMembership, _verifyRoomPermission],
});

export const updateUserRole = serverAction({
    fn: async function (
        ctx: VerifyRoomPermissionCtx & {
            targetMembership: HydratedDocument<IMembership>;
        },
        roomId: string,
        memberId: string,
        targetRole: MemberRole
    ): Promise<void> {
        ctx.targetMembership.role = targetRole;

        await ctx.targetMembership.save();

        // TODO: send notification to room members about the update
        revalidateTag(`room-${roomId}`);
    },
    initContext: (ctx, roomId) => {
        ctx.roomId = roomId;
        ctx.requiredRoles = [MemberRole.ADMIN];
    },
    prechecks: [
        async (ctx, roomId, memberId, targetRole) => {
            if (
                targetRole !== MemberRole.MODERATOR &&
                targetRole !== MemberRole.MEMBER
            ) {
                throw new AppError(
                    "Bạn không có quyền thay đổi vai trò này",
                    ErrorCode.FORBIDDEN
                );
            }
            const targetMembership = await Membership.findOne({
                room: roomId,
                user: memberId,
            });

            if (targetMembership == null) {
                throw new AppError(
                    "Thành viên không tồn tại trong phòng",
                    ErrorCode.NOT_FOUND
                );
            }

            ctx.targetMembership = targetMembership;
        },
        _authenticate,
        _verifyMembership,
        _verifyRoomPermission,
    ],
});
