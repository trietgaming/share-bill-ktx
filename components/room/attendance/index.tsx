"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Users, DollarSign, MapPin, Loader } from "lucide-react"
import { cn, formatCurrency, toYYYYMM } from "@/lib/utils"
import { useMutation, useQuery } from "@tanstack/react-query"
import { getRoomMonthAttendance, updateMyMonthAttendance, UpdateMyMonthAttendanceData } from "@/lib/actions/month-attendance"
import { useInvoices, useMonthAttendanceQuery, useRoommatesQuery, useRoomQuery } from "../room-context"
import { Roommate } from "@/types/Roommate"
import { IMonthAttendance } from "@/types/MonthAttendance"
import { useAuth } from "@/components/auth-context"
import { useDebouncedCallback } from "use-debounce"
import { queryClient } from "@/lib/query-client"
import { resolve } from "path"
import { AttendanceSkeleton } from "./skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserAvatar } from "@/components/user-avatar"
import { toast } from "sonner"

// Mock data
const mockData = {
  currentUser: "Nguyễn Văn A",
  members: [
    { id: 1, name: "Nguyễn Văn A", shortName: "A", color: "bg-blue-500" },
    { id: 2, name: "Trần Thị B", shortName: "B", color: "bg-green-500" },
    { id: 3, name: "Lê Văn C", shortName: "C", color: "bg-purple-500" },
  ],
  // Mock attendance data - key is date string, value is array of member IDs who stayed
  attendance: {
    "2024-01-01": [1, 2],
    "2024-01-02": [1, 2, 3],
    "2024-01-03": [1],
    "2024-01-04": [1, 2],
    "2024-01-05": [2, 3],
    "2024-01-06": [1, 2, 3],
    "2024-01-07": [1, 3],
    "2024-01-08": [1, 2],
    "2024-01-09": [1],
    "2024-01-10": [1, 2, 3],
    "2024-01-11": [2, 3],
    "2024-01-12": [1, 2],
    "2024-01-13": [1, 3],
    "2024-01-14": [1, 2, 3],
    "2024-01-15": [1],
  },
  electricInvoice: {
    totalAmount: 1200000,
    perDayRate: 40000,
  },
}

export function AttendanceCalendar() {
  const { data: room } = useRoomQuery();
  const { data: roommates, isLoading: isRoommatesLoading } = useRoommatesQuery();
  const { monthlyInvoices } = useInvoices();
  const { userData } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date())

  // Get days in current month
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()


  const { data: roomAttendance, isLoading: isRoomAttendanceLoading } = useMonthAttendanceQuery(currentDate);

  const roommatesMap = useMemo(() => {
    if (!roommates) return {};
    const map: Record<string, Roommate> = {};
    roommates.forEach(r => {
      map[r.userId] = r;
    });
    return map;
  }, [roommates]);

  const attendanceMap = useMemo<Roommate[][]>(() => {
    const result = Array(daysInMonth).fill(null).map(() => []) as Roommate[][];
    if (!roomAttendance) return result;

    for (let day = 0; day < daysInMonth; day++) {
      roomAttendance.forEach((ma) => {
        if (ma.attendance[day] === "present") {
          result[day].push(roommatesMap[ma.userId]);
        }
      });
    }

    return result;
  }, [roomAttendance, roommatesMap]);

  const attendanceStatus = useMemo(() => {
    if (!roomAttendance) return { processed: 0, unprocessed: 0, totalDays: 0 };

    const currentDate = new Date();
    const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    let processed = 0;
    for (let day = 0; day < totalDays; day++) {
      processed += roomAttendance.every(roommateAttendance => roommateAttendance.attendance[day] !== "undetermined") ? 1 : 0;
    }

    const unprocessed = totalDays - processed;
    return { processed, unprocessed, totalDays };
  }, [roomAttendance]);


  const userAttendanceMap = useMemo<IMonthAttendance["attendance"]>(() => {
    if (!roomAttendance) return [];
    const meAttendance = roomAttendance.find(ma => ma.userId === userData!._id);
    return meAttendance ? meAttendance.attendance : Array(daysInMonth).fill("undetermined");
  }, [roomAttendance, userData, daysInMonth]);

  const updateAttendanceDebounced = useDebouncedCallback(async (snapshot: IMonthAttendance, resolve: () => void, reject: (error: any) => void) => {
    const roomId = snapshot.roomId;
    const month = snapshot.month;
    try {
      const updateData: UpdateMyMonthAttendanceData = {
        roomId: roomId,
        month: month,
        attendance: snapshot.attendance || Array(daysInMonth).fill("undetermined"),
      }
      await updateMyMonthAttendance(updateData);
      if (!updateAttendanceDebounced.isPending()) resolve();
    } catch (error) {
      reject(error);
    }
  }, 1000);

  const { mutate: handleUpdateMyMonthAttendance } = useMutation({
    mutationFn: (snapshot: IMonthAttendance) => {
      return new Promise<void>((resolve, reject) => {
        updateAttendanceDebounced(snapshot, resolve, reject);
      });
    },
    onMutate: () => {
      toast.loading("Đang cập nhật ngày ở...", { id: "update-attendance", closeButton: false });
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", room._id, month] });
      console.error("Failed to update attendance:", error);
      toast.error("Có lỗi xảy ra khi cập nhật ngày ở.");
    },
    onSettled: () => {
      toast.dismiss("update-attendance");
    }
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (updateAttendanceDebounced.isPending()) {
        e.preventDefault();
        // legacy method for some browsers
        e.returnValue = true;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [updateAttendanceDebounced]);

  const electricInvoice = useMemo(() => {
    return monthlyInvoices.find(inv => inv.type === "walec" && inv.monthApplied === toYYYYMM(currentDate))
  }, [monthlyInvoices, currentDate])

  const userElectricCostPerDay = Math.round((electricInvoice?.personalAmount || 0) / userAttendanceMap.filter(a => a !== "absent").length)

  // Generate calendar days
  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 0; day < daysInMonth; day++) {
    calendarDays.push(day)
  }

  const toggleUserAttendance = (day: number) => {
    const currentAvailability = userAttendanceMap[day];

    const shouldAbsent = currentAvailability === "present";
    const shouldPresent = currentAvailability === "undetermined";

    let snapshot: IMonthAttendance;
    // Optimistically update UI
    queryClient.setQueryData<IMonthAttendance[]>(["attendance", room._id, toYYYYMM(currentDate)], (old) => {
      if (!old) return old;

      return old.map(ma => {
        if (ma.userId === userData!._id) {
          const newAttendance = [...ma.attendance];
          newAttendance[day] = shouldAbsent ? "absent" : shouldPresent ? "present" : "undetermined";
          return (snapshot = { ...ma, attendance: newAttendance });
        }
        return ma;
      });
    });

    queryClient.setQueryData<IMonthAttendance[]>(["attendance", room._id], (old) => {
      return old?.map(ma => {
        if (ma.userId === userData!._id && ma.month == snapshot.month) {
          return snapshot!;
        }
        return ma;
      }) || old;
    });

    handleUpdateMyMonthAttendance(snapshot!);
  }

  const getDayStatus = (day: number) => {
    const attendees = attendanceMap[day];

    return {
      availability: userAttendanceMap[day],
      attendees: attendees,
      isToday: day + 1 === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear(),
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      const newMonth = prev.getMonth() + (direction === "prev" ? -1 : 1);
      newDate.setMonth(newMonth);
      return newDate;
    })
  }

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
  ]

  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

  if (isRoommatesLoading || isRoomAttendanceLoading) {
    return <AttendanceSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ngày ở của bạn</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {userAttendanceMap.filter((status) => status === "present").length}/{daysInMonth}
            </div>
            <p className="text-xs text-muted-foreground">Ngày trong {monthNames[month]}</p>
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
            <div className="text-2xl font-bold text-primary">{formatCurrency(electricInvoice?.personalAmount || 0)}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(userElectricCostPerDay)}/ngày</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Ngày ở đã xử lý</CardTitle>
            <Calendar className="h-3 md:h-4 w-3 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-primary">
              {attendanceStatus.processed}/{attendanceStatus.totalDays}
            </div>
            <p className="text-xs text-muted-foreground">Là những ngày tất cả thành viên đã tích</p>
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
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[120px] text-center">
                {monthNames[month]} {year}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
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
                <UserAvatar key={roommate.userId} className="h-5 w-5" user={roommate} />
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
                  return <div key={-(index + 1)} className="p-2 h-20"></div>
                }

                const dayStatus = getDayStatus(day)

                return (
                  <button
                    key={day}
                    onClick={() => toggleUserAttendance(day)}
                    className={cn(
                      "p-2 h-20 border rounded-lg transition-colors hover:bg-muted/50 flex flex-col items-center justify-start gap-1",
                      dayStatus.availability === "present"
                        ? "bg-primary/10 border-primary text-primary"
                        : dayStatus.availability === "absent"
                          ? "bg-destructive/10 border-destructive text-destructive"
                          : "bg-muted/10 border-muted bg-muted text-muted-foreground",
                      dayStatus.isToday && "ring-2 ring-primary ring-offset-2",
                    )}
                  >
                    <span className="text-sm font-medium">{day + 1}</span>
                    <div className="flex flex-wrap gap-0.5 justify-center max-w-full overflow-hidden">
                      {dayStatus.attendees.slice(0, 4).map((member) => (
                        <div
                          key={member.userId}
                          className="flex items-center"
                        >
                          <UserAvatar className="h-5 w-5" user={member} />
                        </div>
                      ))}
                      {dayStatus.attendees.length > 3 && (
                        <Badge className="text-[10px] px-1 py-0 bg-gray-500 text-white h-4">
                          +{dayStatus.attendees.length - 3}
                        </Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Hướng dẫn:</strong> Click vào ngày để chuyển đổi trạng thái ở/không ở của bạn.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
