export const enum MemberRole {
    ADMIN = 'admin',
    MODERATOR = 'moderator',
    MEMBER = 'member',
}

export const RolePrecedence: Record<MemberRole, number> = {
    [MemberRole.ADMIN]: 3,
    [MemberRole.MODERATOR]: 2,
    [MemberRole.MEMBER]: 1,
}