import { Membership } from "@/models/Membership";
import { IMembership, MembershipDocument } from "@/types/membership";
import { ErrorCode } from "@/enums/error";
import { MemberRole } from "@/enums/member-role";
import { PrecheckResponse, PrecheckSyncResponse } from "@/types/actions";
import { PrecheckError } from "../errors";
import { DecodedIdToken } from "@/types/auth";
import { UserCtx } from "./auth";

export async function verifyMembership(
    userId: string,
    roomId: string
): PrecheckResponse<MembershipDocument> {
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

export interface VerifyMembershipCtx extends UserCtx {
    roomId: string;
    membership: IMembership;
}

export async function _verifyMembership(context: VerifyMembershipCtx) {
    const membership = await Membership.findOne({
        user: context.user.uid,
        room: context.roomId,
    });
    if (!membership) {
        throw new PrecheckError(
            "Người dùng không phải là thành viên của phòng hoặc phòng không tồn tại"
        );
    }

    (context as any).membership = membership;
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

export interface VerifyRoomPermissionCtx extends VerifyMembershipCtx {
    requiredRoles: MemberRole[];
}

export function _verifyRoomPermission(context: VerifyRoomPermissionCtx) {
    const { membership, requiredRoles } = context;
    if (!requiredRoles.includes(membership.role)) {
        throw new PrecheckError(
            "Người dùng không có quyền thực hiện hành động này"
        );
    }
}
