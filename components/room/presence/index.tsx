"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    MapPin,
} from "lucide-react";
import { cn, formatCurrency, toYYYYMM } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import {
    updateMyMonthPresence,
    UpdateMyMonthPresenceData,
} from "@/lib/actions/month-presence";
import {
    useInvoices,
    useMonthPresenceQuery,
    useRoommatesQuery,
    useRoomQuery,
} from "../room-context";
import { Roommate } from "@/types/roommate";
import { IMonthPresence } from "@/types/month-presence";
import { useAuth } from "@/components/auth-context";
import { useDebouncedCallback } from "use-debounce";
import { presenceQueryKey, queryClient } from "@/lib/query-client";
import { PresenceSkeleton } from "./skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { toast } from "sonner";
import { handleAction } from "@/lib/action-handler";
import { PresenceStatus } from "@/enums/presence";

export function PresenceCalendar() {
    const { data: room } = useRoomQuery();
    const { data: roommates, isLoading: isRoommatesLoading } =
        useRoommatesQuery();
    const { monthlyInvoices } = useInvoices();
    const { userData } = useAuth();

    const [currentDate, setCurrentDate] = useState(new Date());

    // Get days in current month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const { data: roomPresence, isLoading: isRoomPresenceLoading } =
        useMonthPresenceQuery(currentDate);

    const roommatesMap = useMemo(() => {
        if (!roommates) return {};
        const map: Record<string, Roommate> = {};
        roommates.forEach((r) => {
            map[r.userId] = r;
        });
        return map;
    }, [roommates]);

    const presenceMap = useMemo<Roommate[][]>(() => {
        const result = Array(daysInMonth)
            .fill(null)
            .map(() => []) as Roommate[][];
        if (!roomPresence) return result;

        for (let day = 0; day < daysInMonth; day++) {
            roomPresence.forEach((mp) => {
                if (mp.presence[day] === PresenceStatus.PRESENT) {
                    result[day].push(roommatesMap[mp.userId]);
                }
            });
        }

        return result;
    }, [roomPresence, roommatesMap]);

    const presenceStatus = useMemo(() => {
        if (!roomPresence)
            return { processed: 0, unprocessed: 0, totalDays: 0 };

        const currentDate = new Date();
        const totalDays = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0
        ).getDate();

        let processed = 0;
        for (let day = 0; day < totalDays; day++) {
            processed += roomPresence.every(
                (roommatePresence) =>
                    roommatePresence.presence[day] !== PresenceStatus.UNDETERMINED
            )
                ? 1
                : 0;
        }

        const unprocessed = totalDays - processed;
        return { processed, unprocessed, totalDays };
    }, [roomPresence]);

    const userPresenceMap = useMemo<IMonthPresence["presence"]>(() => {
        if (!roomPresence) return [];
        const mePresence = roomPresence.find(
            (mp) => mp.userId === userData!._id
        );
        return mePresence
            ? mePresence.presence
            : Array(daysInMonth).fill(PresenceStatus.UNDETERMINED);
    }, [roomPresence, userData, daysInMonth]);

    const updatePresenceDebounced = useDebouncedCallback(
        async (
            snapshot: IMonthPresence,
            resolve: () => void,
            reject: (error: any) => void
        ) => {
            const roomId = snapshot.roomId;
            const month = snapshot.month;
            try {
                const updateData: UpdateMyMonthPresenceData = {
                    roomId: roomId,
                    month: month,
                    presence:
                        snapshot.presence ||
                        Array(daysInMonth).fill(PresenceStatus.UNDETERMINED),
                };
                await handleAction(updateMyMonthPresence(updateData));
                if (!updatePresenceDebounced.isPending()) resolve();
            } catch (error) {
                reject(error);
            }
        },
        1000
    );

    const { mutate: handleUpdateMyMonthPresence } = useMutation({
        mutationFn: (snapshot: IMonthPresence) => {
            return new Promise<void>((resolve, reject) => {
                updatePresenceDebounced(snapshot, resolve, reject);
            });
        },
        onMutate: () => {
            toast.loading("Đang cập nhật ngày ở...", {
                id: "update-presence",
                closeButton: false,
            });
        },
        onError: (error) => {
            queryClient.invalidateQueries({
                queryKey: presenceQueryKey(room._id, toYYYYMM(year, month)),
            });
            console.error("Failed to update presence:", error);
            toast.error("Có lỗi xảy ra khi cập nhật ngày ở.", {
                description: error?.message,
            });
        },
        onSettled: () => {
            toast.dismiss("update-presence");
        },
    });

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (updatePresenceDebounced.isPending()) {
                e.preventDefault();
                // legacy method for some browsers
                e.returnValue = true;
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [updatePresenceDebounced]);

    const electricInvoice = useMemo(() => {
        return monthlyInvoices.find(
            (inv) =>
                inv.type === "walec" &&
                inv.monthApplied === toYYYYMM(currentDate)
        );
    }, [monthlyInvoices, currentDate]);

    const userElectricCostPerDay = Math.round(
        (electricInvoice?.personalAmount || 0) /
            (userPresenceMap.filter((a) => a !== PresenceStatus.ABSENT).length || 1)
    );

    // Generate calendar days
    const calendarDays = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
    }

    // Add days of the month
    for (let day = 0; day < daysInMonth; day++) {
        calendarDays.push(day);
    }

    const toggleUserPresence = (day: number) => {
        const currentAvailability = userPresenceMap[day];

        const shouldAbsent = currentAvailability === PresenceStatus.PRESENT;
        const shouldPresent = currentAvailability === PresenceStatus.UNDETERMINED;

        let snapshot: IMonthPresence;
        // Optimistically update UI
        queryClient.setQueryData<IMonthPresence[]>(
            ["presence", room._id, toYYYYMM(currentDate)],
            (old) => {
                if (!old) return old;

                return old.map((mp) => {
                    if (mp.userId === userData!._id) {
                        const newPresence = [...mp.presence];
                        newPresence[day] = shouldAbsent
                            ? PresenceStatus.ABSENT
                            : shouldPresent
                            ? PresenceStatus.PRESENT
                            : PresenceStatus.UNDETERMINED;
                        return (snapshot = { ...mp, presence: newPresence });
                    }
                    return mp;
                });
            }
        );

        queryClient.setQueryData<IMonthPresence[]>(
            ["presence", room._id],
            (old) => {
                return (
                    old?.map((mp) => {
                        if (
                            mp.userId === userData!._id &&
                            mp.month == snapshot.month
                        ) {
                            return snapshot!;
                        }
                        return mp;
                    }) || old
                );
            }
        );

        handleUpdateMyMonthPresence(snapshot!);
    };

    const getDayStatus = (day: number) => {
        const attendees = presenceMap[day];

        return {
            availability: userPresenceMap[day],
            attendees: attendees,
            isToday:
                day + 1 === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear(),
        };
    };

    const navigateMonth = (direction: "prev" | "next") => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            const newMonth = prev.getMonth() + (direction === "prev" ? -1 : 1);
            newDate.setMonth(newMonth);
            return newDate;
        });
    };

    const monthNames = [
        "Tháng 1",
        "Tháng 2",
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
        "Tháng 7",
        "Tháng 8",
        "Tháng 9",
        "Tháng 10",
        "Tháng 11",
        "Tháng 12",
    ];

    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    if (isRoommatesLoading || isRoomPresenceLoading) {
        return <PresenceSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ngày ở của bạn
                        </CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {
                                userPresenceMap.filter(
                                    (status) => status === PresenceStatus.PRESENT
                                ).length
                            }
                            /{daysInMonth}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Ngày trong {monthNames[month]}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tiền điện nước của bạn
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {formatCurrency(
                                electricInvoice?.personalAmount || 0
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatCurrency(userElectricCostPerDay)}/ngày
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium">
                            Ngày ở đã xử lý
                        </CardTitle>
                        <Calendar className="h-3 md:h-4 w-3 md:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg md:text-2xl font-bold text-primary">
                            {presenceStatus.processed}/
                            {presenceStatus.totalDays}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Là những ngày tất cả thành viên đã tích
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Lịch tích ngày ở
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigateMonth("prev")}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-semibold min-w-[120px] text-center">
                                {monthNames[month]} {year}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigateMonth("next")}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Legend */}
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-primary rounded"></div>
                            <span>Bạn đã ở</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-destructive rounded"></div>
                            <span>Bạn không ở</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-muted rounded"></div>
                            <span>Chưa quyết định</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary rounded"></div>
                            <span>Hôm nay</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>Thành viên:</span>
                            {roommates?.map((roommate) => (
                                <UserAvatar
                                    key={roommate.userId}
                                    className="h-5 w-5"
                                    user={roommate}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent px-2">
                        <div className="grid grid-cols-7 gap-1 min-w-[500px]">
                            {/* Day headers */}
                            {dayNames.map((day) => (
                                <div
                                    key={day}
                                    className="p-2 text-center text-sm font-medium text-muted-foreground sticky top-0 bg-background z-10 border-b"
                                >
                                    {day}
                                </div>
                            ))}

                            {/* Calendar days */}
                            {calendarDays.map((day, index) => {
                                if (day === null) {
                                    return (
                                        <div
                                            key={-(index + 1)}
                                            className="p-2 h-20"
                                        ></div>
                                    );
                                }

                                const dayStatus = getDayStatus(day);

                                return (
                                    <button
                                        key={day}
                                        onClick={() => toggleUserPresence(day)}
                                        className={cn(
                                            "p-2 h-20 border rounded-lg transition-colors hover:bg-muted/50 flex flex-col items-center justify-start gap-1",
                                            dayStatus.availability === PresenceStatus.PRESENT
                                                ? "bg-primary/10 border-primary text-primary"
                                                : dayStatus.availability ===
                                                  PresenceStatus.ABSENT
                                                ? "bg-destructive/10 border-destructive text-destructive"
                                                : "border-muted bg-muted text-muted-foreground",
                                            dayStatus.isToday &&
                                                "ring-2 ring-primary ring-offset-2"
                                        )}
                                    >
                                        <span className="text-sm font-medium">
                                            {day + 1}
                                        </span>
                                        <div className="flex flex-wrap gap-0.5 justify-center max-w-full overflow-hidden">
                                            {dayStatus.attendees
                                                .slice(0, 4)
                                                .map((member) => (
                                                    <div
                                                        key={member.userId}
                                                        className="flex items-center"
                                                    >
                                                        <UserAvatar
                                                            className="h-5 w-5"
                                                            user={member}
                                                        />
                                                    </div>
                                                ))}
                                            {dayStatus.attendees.length > 3 && (
                                                <Badge className="text-[10px] px-1 py-0 bg-gray-500 text-white h-4">
                                                    +
                                                    {dayStatus.attendees
                                                        .length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            <strong>Hướng dẫn:</strong> Click vào ngày để chuyển
                            đổi trạng thái ở/không ở của bạn.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
