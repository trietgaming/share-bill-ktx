import { Membership } from "@/models/Membership";

export async function verifyMembership(userId: string, roomId: string) {
    const membership = await Membership.findOne({ user: userId, room: roomId });
    if (!membership) {
        throw new Error("User is not a member of this room");
    }

    return membership;
}
