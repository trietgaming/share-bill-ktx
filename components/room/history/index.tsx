"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { History, Search, Filter, User, Receipt, Settings } from "lucide-react";
import { useRoomQuery, useRoommates } from "@/components/room/contexts/room-context";
import { getRoomActivity } from "@/lib/actions/room-activity";
import { handleAction } from "@/lib/action-handler";
import { RoomActivityType } from "@/enums/room-activity";
import { IRoomActivity } from "@/types/room-activity";
import { formatCurrency, formatDate } from "@/lib/utils";

type ActivityGroup = "invoice" | "member" | "room";

const ACTIVITY_GROUPS: Record<RoomActivityType, ActivityGroup> = {
    [RoomActivityType.ROOM_CREATED]: "room",
    [RoomActivityType.ROOM_UPDATED]: "room",
    [RoomActivityType.MEMBER_JOINED]: "member",
    [RoomActivityType.MEMBER_LEFT]: "member",
    [RoomActivityType.MEMBER_KICKED]: "member",
    [RoomActivityType.MEMBER_ROLE_UPDATED]: "member",
    [RoomActivityType.INVOICE_CREATED]: "invoice",
    [RoomActivityType.INVOICE_UPDATED]: "invoice",
    [RoomActivityType.INVOICE_DELETED]: "invoice",
    [RoomActivityType.INVOICE_PAID]: "invoice",
};

const GROUP_ICON = { invoice: Receipt, member: User, room: Settings };
const GROUP_COLOR: Record<ActivityGroup, string> = {
    invoice: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    member: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    room: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};
const GROUP_LABEL: Record<ActivityGroup, string> = {
    invoice: "Hóa đơn",
    member: "Thành viên",
    room: "Phòng",
};

function describeActivity(activity: IRoomActivity, actorName: string): string {
    const payload = activity.payload || {};
    switch (activity.type) {
        case RoomActivityType.ROOM_CREATED:
            return `${actorName} đã tạo phòng${payload.name ? ` "${payload.name}"` : ""}`;
        case RoomActivityType.ROOM_UPDATED:
            return `${actorName} đã cập nhật thông tin phòng`;
        case RoomActivityType.MEMBER_JOINED:
            return `${actorName} đã tham gia phòng`;
        case RoomActivityType.MEMBER_LEFT:
            return `${actorName} đã rời phòng`;
        case RoomActivityType.MEMBER_KICKED:
            return `${actorName} đã xóa một thành viên khỏi phòng`;
        case RoomActivityType.MEMBER_ROLE_UPDATED:
            return `${actorName} đã thay đổi vai trò của một thành viên`;
        case RoomActivityType.INVOICE_CREATED:
            return `${actorName} đã tạo hóa đơn "${payload.name ?? ""}"`;
        case RoomActivityType.INVOICE_UPDATED:
            return `${actorName} đã chỉnh sửa hóa đơn "${payload.name ?? ""}"`;
        case RoomActivityType.INVOICE_DELETED:
            return `${actorName} đã xóa hóa đơn "${payload.name ?? ""}"`;
        case RoomActivityType.INVOICE_PAID:
            return `${actorName} đã thanh toán ${formatCurrency(
                payload.amount ?? 0
            )} cho hóa đơn "${payload.name ?? ""}"`;
        default:
            return `${actorName} đã thực hiện một hành động`;
    }
}

export function HistoryLog() {
    const { data: room } = useRoomQuery();
    const {
        roommatesQuery: { data: roommates },
    } = useRoommates();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterGroup, setFilterGroup] = useState<"all" | ActivityGroup>("all");

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["room-activity", room._id],
        queryFn: ({ pageParam }: { pageParam: string | null }) =>
            handleAction(getRoomActivity(room._id, { cursor: pageParam })),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) =>
            lastPage.length > 0 ? lastPage[lastPage.length - 1]._id : undefined,
        staleTime: 1000 * 60,
    });

    const roommatesMap = useMemo(() => {
        const map: Record<string, string> = {};
        roommates?.forEach((r) => {
            map[r.userId] = r.displayName;
        });
        return map;
    }, [roommates]);

    const activities = useMemo(() => data?.pages.flat() ?? [], [data]);

    const filteredActivities = activities.filter((activity) => {
        const group = ACTIVITY_GROUPS[activity.type];
        if (filterGroup !== "all" && group !== filterGroup) return false;
        if (!searchTerm) return true;

        const actorName = roommatesMap[activity.actorId] || "";
        const description = describeActivity(activity, actorName);
        return description.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-6">
            {/* Header with Search and Filter */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Lịch sử thay đổi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm hoạt động..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={filterGroup}
                            onValueChange={(value) =>
                                setFilterGroup(value as "all" | ActivityGroup)
                            }
                        >
                            <SelectTrigger className="w-full md:w-[200px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Lọc theo loại" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="invoice">Hóa đơn</SelectItem>
                                <SelectItem value="member">Thành viên</SelectItem>
                                <SelectItem value="room">Phòng</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* History Timeline */}
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {isLoading ? (
                            <p className="text-center text-muted-foreground py-8">
                                Đang tải...
                            </p>
                        ) : filteredActivities.length === 0 ? (
                            <div className="text-center py-8">
                                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    Không tìm thấy hoạt động nào
                                </p>
                            </div>
                        ) : (
                            filteredActivities.map((activity, index) => {
                                const group = ACTIVITY_GROUPS[activity.type];
                                const Icon = GROUP_ICON[group];
                                const actorName =
                                    roommatesMap[activity.actorId] ||
                                    "Người dùng đã rời phòng";

                                return (
                                    <div
                                        key={activity._id}
                                        className="flex gap-4 pb-4 border-b border-border last:border-b-0"
                                    >
                                        {/* Timeline indicator */}
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`p-2 rounded-full ${GROUP_COLOR[group]}`}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            {index < filteredActivities.length - 1 && (
                                                <div className="w-px h-12 bg-border mt-2"></div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge
                                                    variant="secondary"
                                                    className={GROUP_COLOR[group]}
                                                >
                                                    {GROUP_LABEL[group]}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(
                                                        activity.createdAt,
                                                        "dd/MM/yyyy HH:mm"
                                                    )}
                                                </span>
                                            </div>
                                            <p className="font-medium text-foreground">
                                                {describeActivity(activity, actorName)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Load More */}
            {hasNextPage && (
                <div className="text-center">
                    <Button
                        variant="outline"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? "Đang tải..." : "Xem thêm hoạt động"}
                    </Button>
                </div>
            )}
        </div>
    );
}
