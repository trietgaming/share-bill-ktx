import { Membership } from "@/models/Membership";
import { IMembership } from "@/types/membership";
import { AppError } from "@/lib/errors";
import { NextResponse } from "next/server";
import { ErrorServerActionResult } from "@/types/actions";
import { ErrorCode } from "@/enums/error";

export async function verifyMembership(userId: string, roomId: string) {
    const membership = await Membership.findOne({ user: userId, room: roomId });
    if (!membership) {
        return NextResponse.json<ErrorServerActionResult>({
            success: false,
            data: null,
            error: {
                message: "Người dùng không phải là thành viên của phòng này",
                code: ErrorCode.FORBIDDEN
            }
        }, { status: 403 }) as never;
    }

    return membership;
}

export function verifyRoomPermission(membership: IMembership, roles: IMembership["role"][]) {
    if (!roles.includes(membership.role)) {
        return NextResponse.json<ErrorServerActionResult>({
            success: false,
            data: null,
            error: {
                message: "Người dùng không có quyền thực hiện hành động này",
                code: ErrorCode.FORBIDDEN
            }
        }, { status: 403 });
    }
}
