import { Membership } from "@/models/Membership";
import { IMembership } from "@/types/membership";
import { ErrorCode } from "@/enums/error";
import { MemberRole } from "@/enums/member-role";
import { PrecheckResponse, PrecheckSyncResponse } from "@/types/actions";

export async function verifyMembership(
    userId: string,
    roomId: string
): PrecheckResponse<IMembership> {
    const membership = await Membership.findOne({ user: userId, room: roomId });
    if (!membership) {
        return [
            null,
            {
                message:
                    "Người dùng không phải là thành viên của phòng hoặc phòng không tồn tại",
                code: ErrorCode.FORBIDDEN,
            },
        ];
    }

    return [membership, null];
}

export function verifyRoomPermission(
    membership: IMembership,
    roles: MemberRole[]
): PrecheckSyncResponse<void> {
    if (!roles.includes(membership.role)) {
        return [
            null,
            {
                message: "Người dùng không có quyền thực hiện hành động này",
                code: ErrorCode.FORBIDDEN,
            },
        ];
    }
    return [void 0, null];
}
