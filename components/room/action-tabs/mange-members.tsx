import {
    Card,
    CardHeader,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import {
    useRoommates,
    useRoomQuery,
} from "@/components/room/contexts/room-context";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { RoleBadge } from "@/components/role-badge";
import { EllipsisVertical, Loader } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { hasPermission, isRolePrecedent } from "@/lib/permission";
import { Roommate } from "@/types/roommate";
import { useAuth } from "@/components/auth-context";
import { useState } from "react";
import { kickMember } from "@/lib/actions/room";
import { handleAction } from "@/lib/action-handler";
import {
    invalidateAllRoomQuery,
} from "@/lib/query-client";
import { toast } from "sonner";
import { useConfirm } from "@/components/are-you-sure";

export function ManageMembersTab() {
    const {
        roommatesQuery: { data: roommates },
        membership,
    } = useRoommates();
    const { data: room } = useRoomQuery();
    const { userData } = useAuth();
    const [isKicking, setIsKicking] = useState<string | null>(null);

    const canKick = (member: Roommate) => {
        return (
            hasPermission("room.members.kick", membership?.role) &&
            member.userId !== userData?._id &&
            isRolePrecedent(membership!.role, member.role)
        );
    };

    const handleKick = async (member: Roommate) => {
        console.log("Kicking member", member);
        if (isKicking) return;
        setIsKicking(member.userId);
        try {
            await handleAction(kickMember(room._id, member.userId));

            invalidateAllRoomQuery(room._id);

            toast.success("Đã xóa thành viên khỏi phòng");
        } catch (error) {
            toast.error("Đã có lỗi xảy ra khi xóa thành viên", {
                description: error instanceof Error ? error.message : "",
            });
        }
        setIsKicking(null);
    };

    const confirmKick = useConfirm(handleKick, {
        title: "Xác nhận xóa thành viên",
        description:
            "Bạn có chắc chắn muốn xóa thành viên này khỏi phòng? Tất cả hóa đơn, thông tin của người này sẽ bị xóa. Họ có thể gia nhập lại bất cứ lúc nào.",
        cancelText: "Hủy",
        confirmText: "Xóa",
        variant: "destructive",
    });

    return (
        <div className="w-full h-full bg-sidebar overflow-y-auto p-4 lg:p-6">
            <h2 className="text-lg font-semibold mb-4">Quản lý thành viên</h2>
            <Card>
                <CardHeader>
                    <CardDescription>
                        Thực hiện các hành động quản lý thành viên trong phòng
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
                                        <span className="text-sm">
                                            {member.displayName}
                                        </span>
                                    </div>
                                    <RoleBadge
                                        className="ml-8"
                                        role={member.role}
                                    />
                                </div>
                                {canKick(member) && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-xs rounded-full w-4 h-4"
                                                disabled={!!isKicking}
                                            >
                                                {isKicking === member.userId ? (
                                                    <Loader className="animate-spin" />
                                                ) : (
                                                    <EllipsisVertical />
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem
                                                variant="destructive"
                                                className="w-full"
                                                onClick={() =>
                                                    confirmKick(member)
                                                }
                                            >
                                                Xóa khỏi phòng
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
