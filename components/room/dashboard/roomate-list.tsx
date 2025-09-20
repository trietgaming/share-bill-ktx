import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRoommatesQuery } from "@/components/room/room-context";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";
import { RoleBadge } from "@/components/role-badge";

function RoommateListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className="flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 md:h-10 w-8 md:w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 md:h-5 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function RoomateList() {
    const { userData } = useAuth()
    const { data: roommates, isLoading, error } = useRoommatesQuery();

    if (isLoading) {
        return <RoommateListSkeleton />;
    }

    if (error) {
        toast.error("Đã có lỗi xảy ra khi tải danh sách bạn cùng phòng.", {
            description: error?.message,
        });
        return <div className="text-red-500">Đã có lỗi xảy ra khi tải danh sách bạn cùng phòng.</div>
    }

    return (
        <>{roommates?.map(roommate => (
            <div key={roommate.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 md:h-10 w-8 md:w-10">
                        <AvatarImage src={roommate.photoUrl || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs md:text-sm">
                            {roommate.displayName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium text-sm md:text-base">{roommate.displayName}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {roommate.userId === userData?._id && (
                                <Badge variant="outline" className="text-xs">
                                    Bạn
                                </Badge>
                            )}
                            <RoleBadge role={roommate.role} className="text-xs" />
                            {/* {roommate.role === "admin" && (
                                <Badge variant="default" className="text-xs">
                                    Quản trị viên
                                </Badge>
                            )}
                            {roommate.role === "moderator" && (
                                <Badge variant="secondary" className="text-xs">
                                    Người điều hành
                                </Badge>
                            )} */}
                        </div>
                    </div>
                </div>
            </div>
        ))}</>
    )
}