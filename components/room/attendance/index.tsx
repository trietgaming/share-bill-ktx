"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Users, DollarSign, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

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
  electricBill: {
    totalAmount: 1200000,
    perDayRate: 40000,
  },
}

export function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 1)) // January 2024
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const { members, attendance, electricBill, currentUser } = mockData
  const currentUserId = 1 // Assuming current user is Nguyễn Văn A

  // Get days in current month
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Calculate user's attendance stats
  const userAttendanceDays = Object.entries(attendance).filter(([date, memberIds]) =>
    memberIds.includes(currentUserId),
  ).length

  const userElectricCost = userAttendanceDays * electricBill.perDayRate

  // Generate calendar days
  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const formatDateKey = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const toggleUserAttendance = (day: number) => {
    const dateKey = formatDateKey(day)
    const currentAttendees = attendance[dateKey] || []

    if (currentAttendees.includes(currentUserId)) {
      // Remove user from attendance
      attendance[dateKey] = currentAttendees.filter((id) => id !== currentUserId)
    } else {
      // Add user to attendance
      attendance[dateKey] = [...currentAttendees, currentUserId]
    }

    // Force re-render
    setSelectedDate(dateKey)
    setTimeout(() => setSelectedDate(null), 100)
  }

  const getDayStatus = (day: number) => {
    const dateKey = formatDateKey(day)
    const attendees = attendance[dateKey] || []
    const userAttended = attendees.includes(currentUserId)

    return {
      userAttended,
      attendees: attendees.map((id) => members.find((m) => m.id === id)).filter(Boolean),
      isToday: day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear(),
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
            <p className="text-xs text-muted-foreground">{electricBill.perDayRate.toLocaleString("vi-VN")}đ/ngày</p>
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
              <div className="w-4 h-4 border-2 border-primary rounded"></div>
              <span>Hôm nay</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Thành viên:</span>
              {members.map((member) => (
                <Badge key={member.id} className={cn("text-white", member.color)}>
                  {member.shortName}
                </Badge>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
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
                  return <div key={index} className="p-2 h-20"></div>
                }

                const dayStatus = getDayStatus(day)

                return (
                  <button
                    key={day}
                    onClick={() => toggleUserAttendance(day)}
                    className={cn(
                      "p-2 h-20 border rounded-lg transition-colors hover:bg-muted/50 flex flex-col items-center justify-start gap-1",
                      dayStatus.userAttended
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-destructive/10 border-destructive text-destructive",
                      dayStatus.isToday && "ring-2 ring-primary ring-offset-2",
                    )}
                  >
                    <span className="text-sm font-medium">{day}</span>
                    <div className="flex flex-wrap gap-0.5 justify-center max-w-full overflow-hidden">
                      {dayStatus.attendees.slice(0, 3).map((member) => (
                        <Badge
                          key={member.id}
                          className={cn("text-[10px] px-1 py-0 text-white h-4 min-w-0", member.color)}
                        >
                          {member.shortName}
                        </Badge>
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
