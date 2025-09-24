import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";
import { RoleBadge } from "@/components/role-badge";
import { useRoommates } from "./room/contexts/roommates-context";

function RoommateListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
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
    );
}

export function RoommateList() {
    const { userData } = useAuth();
    const {
        roommatesQuery: { data: roommates, isLoading, error },
        setInspectingRoommate
    } = useRoommates();

    if (isLoading) {
        return <RoommateListSkeleton />;
    }

    if (error) {
        toast.error("Đã có lỗi xảy ra khi tải danh sách bạn cùng phòng.", {
            description: error?.message,
        });
        return (
            <div className="text-red-500">
                Đã có lỗi xảy ra khi tải danh sách bạn cùng phòng.
            </div>
        );
    }

    return (
        <>
            {roommates?.map((roommate) => (
                <div
                    onClick={() => setInspectingRoommate(roommate)}
                    key={roommate.userId}
                    className="shadow-sm flex items-center justify-between hover:cursor-pointer hover:bg-accent p-4 rounded-md transition border"
                >
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 md:h-10 w-8 md:w-10">
                            <AvatarImage
                                src={roommate.photoUrl || "/placeholder.svg"}
                            />
                            <AvatarFallback className="text-xs md:text-sm">
                                {roommate.displayName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium text-sm md:text-base">
                                {roommate.displayName}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                {roommate.userId === userData?._id && (
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        Bạn
                                    </Badge>
                                )}
                                <RoleBadge
                                    role={roommate.role}
                                    className="text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}
