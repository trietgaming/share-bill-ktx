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

export const RoleLabelMap: Record<MemberRole, string> = {
    [MemberRole.ADMIN]: "Quản trị viên",
    [MemberRole.MODERATOR]: "Người điều hành",
    [MemberRole.MEMBER]: "Thành viên",
}