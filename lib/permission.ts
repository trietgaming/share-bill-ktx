import { MemberRole, RolePrecedence } from "@/enums/member-role";

export const permissionMap = {
    "room.invoice.delete": [MemberRole.ADMIN, MemberRole.MODERATOR],

    "room.action.deleteRoom": [MemberRole.ADMIN],
    "room.action.leaveRoom": [MemberRole.MODERATOR, MemberRole.MEMBER],
    "room.action.updateRoomInfo": [MemberRole.ADMIN, MemberRole.MODERATOR],

    "room.members.kick": [MemberRole.ADMIN, MemberRole.MODERATOR],
    "room.members.updateRole": [MemberRole.ADMIN],
} satisfies Record<string, MemberRole[]>;

export function hasPermission(
    permission: keyof typeof permissionMap,
    role?: MemberRole
) {
    return role ? (permissionMap[permission] as MemberRole[]).includes(role) : false;
}

export function isRolePrecedent(role: MemberRole, targetRole: MemberRole) {
    return RolePrecedence[role] > RolePrecedence[targetRole];
}

export function isRolePrecedentOrEqual(role: MemberRole, targetRole: MemberRole) {
    return RolePrecedence[role] >= RolePrecedence[targetRole];
}