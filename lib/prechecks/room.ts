import { Membership } from "@/models/Membership";
import { IMembership } from "@/types/membership";
import { AppError } from "@/lib/errors";

export async function verifyMembership(userId: string, roomId: string) {
    const membership = await Membership.findOne({ user: userId, room: roomId });
    if (!membership) {
        throw new AppError("User is not a member of this room");
    }

    return membership;
}

export function verifyRoomPermission(membership: IMembership, roles: IMembership["role"][]) {
    if (!roles.includes(membership.role)) {
        throw new AppError("User does not have permission to perform this action");
    }
}
