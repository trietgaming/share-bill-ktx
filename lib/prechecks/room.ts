import { Membership } from "@/models/Membership";
import { IMembership } from "@/types/Membership";

export async function verifyMembership(userId: string, roomId: string) {
    const membership = await Membership.findOne({ user: userId, room: roomId });
    if (!membership) {
        throw new Error("User is not a member of this room");
    }

    return membership;
}

export function verifyRoomPermission(membership: IMembership, roles: IMembership["role"][]) {
    if (!roles.includes(membership.role)) {
        throw new Error("User does not have permission to perform this action");
    }
}
