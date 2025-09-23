import {
    Card,
    CardHeader,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import {
    useMembership,
    useRoommatesQuery,
    useRoomQuery,
} from "@/components/room/room-context";
import { UserAvatar } from "@/components/user-avatar";
import { RoleBadge } from "@/components/role-badge";
import { isRolePrecedent, isRolePrecedentOrEqual } from "@/lib/permission";
import { Roommate } from "@/types/roommate";
import { useAuth } from "@/components/auth-context";
import { MemberRole, RoleLabelMap } from "@/enums/member-role";
import { useState } from "react";
import { kickMember, updateUserRole } from "@/lib/actions/room";
import { handleAction } from "@/lib/action-handler";
import {
    invoicesQueryKey,
    presenceQueryKey,
    queryClient,
    roommatesQueryKey,
} from "@/lib/query-client";
import { toYYYYMM } from "@/lib/utils";
import { toast } from "sonner";
import { useConfirm } from "@/components/are-you-sure";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const availableRoles = [MemberRole.MEMBER, MemberRole.MODERATOR];

export function ManagePermissionsTab() {
    const { data: roommates } = useRoommatesQuery();
    const { data: room } = useRoomQuery();
    const { userData } = useAuth();
    const membership = useMembership();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const canChangePermission = (member: Roommate) => {
        return (
            isRolePrecedentOrEqual(membership?.role, MemberRole.ADMIN) &&
            member.userId !== userData?._id &&
            isRolePrecedent(membership!.role, member.role)
        );
    };

    const handleUpdatePermission = async (
        member: Roommate,
        targetRole: MemberRole
    ) => {
        if (isUpdating) return;
        setIsUpdating(member.userId);
        try {
            await handleAction(
                updateUserRole(room._id, member.userId, targetRole)
            );
            queryClient.invalidateQueries({
                queryKey: roommatesQueryKey(room._id),
            });
            toast.success("Cập nhật quyền thành công");
        } catch (error) {
            toast.error("Đã có lỗi xảy ra khi cập nhật quyền", {
                description: error instanceof Error ? error.message : "",
            });
        }
        setIsUpdating(null);
    };

    const confirmUpdate = useConfirm(handleUpdatePermission, {
        title: "Xác nhận cập nhật quyền?",
        description: "Bạn có chắc chắn muốn cập nhật quyền cho người này?",
        cancelText: "Hủy",
        confirmText: "Cập nhật",
    });

    return (
        <div className="w-full h-full bg-sidebar overflow-y-auto p-4 lg:p-6">
            <h2 className="text-lg font-semibold mb-4">Quản lý quyền</h2>
            <Card>
                <CardHeader>
                    <CardDescription>
                        Thay đổi quyền cho các thành viên trong phòng.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {roommates?.map((member) => {
                        return (
                            <div
                                key={member.userId}
                                className="flex items-center justify-between py-2"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <UserAvatar
                                            className="w-6 h-6"
                                            user={member}
                                        />
                                        <span className="text-sm max-w-[100px] truncate">
                                            {member.displayName}
                                        </span>
                                    </div>
                                </div>
                                {member.role === MemberRole.ADMIN ? (
                                    <RoleBadge role={member.role} />
                                ) : (
                                    <Select
                                        value={member.role}
                                        disabled={
                                            isUpdating === member.userId ||
                                            !canChangePermission(member)
                                        }
                                        onValueChange={(value) =>
                                            value !== member.role &&
                                            confirmUpdate(
                                                member,
                                                value as MemberRole
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            size="sm"
                                            className="text-xs"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableRoles.map((selectableRole) => (
                                                <SelectItem
                                                    className="text-xs"
                                                    key={selectableRole}
                                                    value={selectableRole}
                                                >
                                                    {RoleLabelMap[selectableRole]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
