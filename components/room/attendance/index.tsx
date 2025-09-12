"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Users, DollarSign, MapPin, Loader } from "lucide-react"
import { cn, toYYYYMM } from "@/lib/utils"
import { useMutation, useQuery } from "@tanstack/react-query"
import { getRoomMonthAttendance, updateMyMonthAttendance, UpdateMyMonthAttendanceData } from "@/lib/actions/month-attendance"
import { useRoommatesQuery, useRoomQuery } from "../room-context"
import { Roommate } from "@/types/Roommate"
import { IMonthAttendance } from "@/types/MonthAttendance"
import { useAuth } from "@/components/auth-context"
import { useDebouncedCallback } from "use-debounce"
import { queryClient } from "@/lib/query-client"
import { resolve } from "path"
import { AttendanceSkeleton } from "./skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserAvatar } from "@/components/user-avatar"

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
  const { userData } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date())

  // Get days in current month
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()


  const { data: roomAttendance, isLoading: isRoomAttendanceLoading } = useQuery<IMonthAttendance[]>({
    queryKey: ["attendance", room._id, toYYYYMM(currentDate)],
    queryFn: () => getRoomMonthAttendance(room._id, toYYYYMM(currentDate)),
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  const roommatesMap = useMemo(() => {
    if (!roommates) return {};
    const map: Record<string, Roommate> = {};
    roommates.forEach(r => {
      map[r.userId] = r;
    });
    return map;
  }, [roommates]);

  console.log(roomAttendance);

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

  const userAttendanceMap = useMemo<IMonthAttendance["attendance"]>(() => {
    if (!roomAttendance) return [];
    const meAttendance = roomAttendance.find(ma => ma.userId === userData!._id);
    return meAttendance ? meAttendance.attendance : Array(daysInMonth).fill("undetermined");
  }, [roomAttendance, userData, daysInMonth]);

  const meAsRoommate = roommates?.find(r => r.userId === userData!._id);

  const updateAttendanceDebounced = useDebouncedCallback(async (resolve: () => void, reject: (error: any) => void) => {
    try {
      const updateData: UpdateMyMonthAttendanceData = {
        roomId: room._id,
        month: toYYYYMM(currentDate),
        attendance: roomAttendance!.find(ma => ma.userId === userData!._id)?.attendance || Array(daysInMonth).fill("undetermined"),
      }
      await updateMyMonthAttendance(updateData);
      queryClient.invalidateQueries({ queryKey: ["attendance", room._id, toYYYYMM(currentDate)] });
      resolve();
    } catch (error) {
      reject(error);
    }
  }, 2000);

  const { mutate: handleUpdateMyMonthAttendance, isPending: isUpdatingMonthAttendance } = useMutation({
    mutationFn: () => {
      return new Promise<void>((resolve, reject) => {
        updateAttendanceDebounced(resolve, reject);
      });
    }
  });


  const { members, attendance, electricInvoice, currentUser } = mockData
  const currentUserId = 1 // Assuming current user is Nguyễn Văn A


  // Calculate user's attendance stats
  const userAttendanceDays = Object.values(userAttendanceMap).reduce((count, status) =>
    status === "present" ? count + 1 : count
  , 0)

  const userElectricCost = userAttendanceDays * electricInvoice.perDayRate

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
    const currentAttendees = attendanceMap[day];

    const shouldAbsent = currentAttendees.includes(meAsRoommate!);

    // Optimistically update UI
    queryClient.setQueryData<IMonthAttendance[]>(["attendance", room._id, toYYYYMM(currentDate)], (old) => {
      if (!old) return old;

      return old.map(ma => {
        if (ma.userId === userData!._id) {
          const newAttendance = [...ma.attendance];
          newAttendance[day] = shouldAbsent ? "absent" : "present";
          return { ...ma, attendance: newAttendance };
        }
        return ma;
      });
    });

    handleUpdateMyMonthAttendance();
  }
  console.log(attendanceMap);

  const getDayStatus = (day: number) => {
    const attendees = attendanceMap[day];

    return {
      availability: userAttendanceMap[day],
      attendees: attendees.filter(m => m.userId !== userData!._id),
      isToday: day + 1 === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear(),
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
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
              {userAttendanceDays}/{daysInMonth}
            </div>
            <p className="text-xs text-muted-foreground">Ngày trong tháng {monthNames[month]}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiền điện nước của bạn</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{userElectricCost.toLocaleString("vi-VN")}đ</div>
            <p className="text-xs text-muted-foreground">{electricInvoice.perDayRate.toLocaleString("vi-VN")}đ/ngày</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thành viên hoạt động</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">Người trong phòng</p>
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
              {isUpdatingMonthAttendance && <Loader className="h-4 w-4 animate-spin text-muted-foreground" />}
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
                      {dayStatus.attendees.slice(0, 3).map((member) => (
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
              <strong>Hướng dẫn:</strong> Click vào ngày để chuyển đổi trạng thái ở/không ở của bạn. Các badge hiển thị
              thành viên khác đã ở trong ngày đó. Calendar có thể cuộn nếu nội dung quá dài.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
