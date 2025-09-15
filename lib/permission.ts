import { IMembership } from "@/types/Membership";

export const permissionMap = {
    "room.invoice.delete": ["admin", "moderator"],

    "room.action.deleteRoom": ["admin"],
    "room.action.leaveRoom": ["moderator", "member"],
    "room.action.updateRoomInfo": ["admin", "moderator"],
    
    "room.members.kick": ["admin", "moderator"],
    "room.members.updateRole": ["admin"],
}

export function hasPermission(permission: keyof typeof permissionMap, role?: IMembership["role"]) {
    return role ? permissionMap[permission].includes(role) : false;
}