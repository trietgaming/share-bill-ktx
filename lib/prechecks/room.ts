import { Membership } from "@/models/Membership";
import { IMembership } from "@/types/membership";
import { ErrorCode } from "@/enums/error";
import { responseWithError } from "@/lib/actions-helper";

export async function verifyMembership(userId: string, roomId: string) {
    const membership = await Membership.findOne({ user: userId, room: roomId });
    if (!membership) {
        return responseWithError(
            "Người dùng không phải là thành viên của phòng hoặc phòng không tồn tại",
            ErrorCode.FORBIDDEN,
            403
        ) as never;
    }

    return membership;
}

export function verifyRoomPermission(
    membership: IMembership,
    roles: IMembership["role"][]
) {
    if (!roles.includes(membership.role)) {
        return responseWithError(
            "Người dùng không có quyền thực hiện hành động này",
            ErrorCode.FORBIDDEN,
            403
        ) as never;
    }
}
