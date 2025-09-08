"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Zap, Receipt, Calendar, CheckCircle, XCircle, AlertCircle, DollarSign } from "lucide-react"
import { useRoom, useRoommates } from "@/components/room/room-context"
import RoomateList from "./roomate-list"

// Mock data - trong thực tế sẽ fetch từ API
const mockData = {
  members: [
    { id: 1, name: "Nguyễn Văn A", avatar: "", isAdmin: true, status: "active" },
    { id: 2, name: "Trần Thị B", avatar: "", isAdmin: false, status: "active" },
    { id: 3, name: "Lê Văn C", avatar: "", isAdmin: false, status: "inactive" },
  ],
  electricBill: {
    amount: 450000,
    status: "unpaid",
    dueDate: "2024-01-15",
    month: "Tháng 12/2023",
  },
  otherBills: [
    { id: 1, name: "Internet", amount: 200000, status: "unpaid" },
    { id: 2, name: "Vệ sinh chung", amount: 50000, status: "paid" },
  ],
  attendanceStatus: {
    processed: 15,
    unprocessed: 3,
    totalDays: 31,
  },
}

export function HomeDashboard() {
  const room = useRoom();

  const { electricBill, otherBills, attendanceStatus } = mockData

  const unpaidBills = otherBills.filter((bill) => bill.status === "unpaid")

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Điện nước tháng này</CardTitle>
            <Zap className="h-3 md:h-4 w-3 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-destructive">
              {electricBill.amount.toLocaleString("vi-VN")}đ
            </div>
            <p className="text-xs text-muted-foreground">{electricBill.month} - Chưa thanh toán</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Hóa đơn khác</CardTitle>
            <Receipt className="h-3 md:h-4 w-3 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-destructive">
              {electricBill.amount.toLocaleString("vi-VN")}đ
            </div>
            <p className="text-xs text-muted-foreground">{electricBill.month} - Chưa thanh toán</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Ngày ở</CardTitle>
            <Calendar className="h-3 md:h-4 w-3 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-primary">
              {attendanceStatus.processed}/{attendanceStatus.totalDays}
            </div>
            <p className="text-xs text-muted-foreground">Đã xử lý</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Users className="h-4 md:h-5 w-4 md:w-5" />
              <span>Thành viên trong phòng</span>
              <span className="text-sm text-muted-foreground">({room.members.length}/{room.maxMembers})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              <RoomateList />
            </div>
          </CardContent>
        </Card>

        {/* Bills Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Receipt className="h-4 md:h-5 w-4 md:w-5" />
              Tình trạng hóa đơn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            {/* Electric Bill */}
            <div className="p-3 md:p-4 border border-destructive/30 bg-destructive/15 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-sm md:text-base text-foreground">
                    Điện nước {electricBill.month}
                  </span>
                </div>
                <Badge variant="destructive" className="text-xs">
                  <XCircle className="h-3 w-3 mr-1" />
                  Chưa đóng
                </Badge>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-base md:text-lg font-bold text-foreground">
                  {electricBill.amount.toLocaleString("vi-VN")}đ
                </span>
                <Button size="sm" variant="destructive" className="text-xs">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Thanh toán
                </Button>
              </div>
              <p className="text-xs text-foreground/70 mt-1">Hạn thanh toán: {electricBill.dueDate}</p>
            </div>

            {/* Other Bills */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Hóa đơn khác</h4>
              {otherBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-2 md:p-3 border rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">{bill.name}</span>
                    <Badge
                      variant={bill.status === "paid" ? "default" : "destructive"}
                      className="text-xs flex-shrink-0"
                    >
                      {bill.status === "paid" ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Đã đóng
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Chưa đóng
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-medium text-sm">{bill.amount.toLocaleString("vi-VN")}đ</span>
                    {bill.status === "unpaid" && (
                      <Button size="sm" variant="outline" className="text-xs bg-transparent">
                        Thanh toán
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Calendar className="h-4 md:h-5 w-4 md:w-5" />
            Trạng thái ngày ở tháng này
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="text-center p-3 md:p-4 bg-muted rounded-lg border-l-4 border-primary">
              <div className="text-xl md:text-2xl font-bold text-foreground">{attendanceStatus.processed}</div>
              <p className="text-xs md:text-sm text-muted-foreground">Ngày đã xử lý</p>
            </div>
            <div className="text-center p-3 md:p-4 bg-muted rounded-lg border-l-4 border-destructive">
              <div className="text-xl md:text-2xl font-bold text-foreground">{attendanceStatus.unprocessed}</div>
              <p className="text-xs md:text-sm text-muted-foreground">Ngày chưa xử lý</p>
            </div>
            <div className="text-center p-3 md:p-4 bg-muted rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-foreground">{attendanceStatus.totalDays}</div>
              <p className="text-xs md:text-sm text-muted-foreground">Tổng số ngày</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" className="text-sm bg-transparent">
              <Calendar className="h-4 w-4 mr-2" />
              Xem chi tiết ngày ở
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
