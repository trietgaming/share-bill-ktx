"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { History, Search, Filter, User, Receipt, Calendar, Settings } from "lucide-react"
import { useState } from "react"

// Mock data for history log
const mockHistoryData = [
  {
    id: 1,
    action: "invoice_payment",
    description: "Thanh toán hóa đơn điện nước tháng 12/2023",
    user: "Nguyễn Văn A",
    timestamp: "2024-01-15 14:30:00",
    details: { amount: 400000, invoiceName: "Điện nước tháng 12/2023" },
    type: "payment",
  },
  {
    id: 2,
    action: "member_added",
    description: "Thêm thành viên mới vào phòng",
    user: "Nguyễn Văn A",
    timestamp: "2024-01-14 09:15:00",
    details: { memberName: "Lê Văn C" },
    type: "member",
  },
  {
    id: 3,
    action: "presence_update",
    description: "Cập nhật ngày ở cho ngày 13/01/2024",
    user: "Trần Thị B",
    timestamp: "2024-01-13 20:45:00",
    details: { date: "2024-01-13", status: "present" },
    type: "presence",
  },
  {
    id: 4,
    action: "invoice_created",
    description: "Tạo hóa đơn mới: Internet tháng 1/2024",
    user: "Nguyễn Văn A",
    timestamp: "2024-01-12 16:20:00",
    details: { amount: 300000, invoiceName: "Internet tháng 1/2024" },
    type: "invoice",
  },
  {
    id: 5,
    action: "settings_updated",
    description: "Cập nhật giá điện nước",
    user: "Nguyễn Văn A",
    timestamp: "2024-01-11 11:00:00",
    details: { oldRate: 35000, newRate: 40000 },
    type: "settings",
  },
  {
    id: 6,
    action: "invoice_edited",
    description: "Chỉnh sửa hóa đơn vệ sinh chung",
    user: "Nguyễn Văn A",
    timestamp: "2024-01-10 13:30:00",
    details: { invoiceName: "Vệ sinh chung", oldAmount: 120000, newAmount: 150000 },
    type: "invoice",
  },
  {
    id: 7,
    action: "member_removed",
    description: "Xóa thành viên khỏi phòng",
    user: "Nguyễn Văn A",
    timestamp: "2024-01-09 10:15:00",
    details: { memberName: "Phạm Văn D" },
    type: "member",
  },
  {
    id: 8,
    action: "presence_bulk_update",
    description: "Cập nhật hàng loạt ngày ở cho tuần đầu tháng 1",
    user: "Nguyễn Văn A",
    timestamp: "2024-01-08 18:00:00",
    details: { dateRange: "01/01 - 07/01", membersCount: 3 },
    type: "presence",
  },
]

export function HistoryLog() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filteredHistory, setFilteredHistory] = useState(mockHistoryData)

  const getActionIcon = (type: string) => {
    switch (type) {
      case "payment":
      case "invoice":
        return <Receipt className="h-4 w-4" />
      case "member":
        return <User className="h-4 w-4" />
      case "presence":
        return <Calendar className="h-4 w-4" />
      case "settings":
        return <Settings className="h-4 w-4" />
      default:
        return <History className="h-4 w-4" />
    }
  }

  const getActionColor = (type: string) => {
    switch (type) {
      case "payment":
        return "bg-green-100 text-green-800"
      case "invoice":
        return "bg-blue-100 text-blue-800"
      case "member":
        return "bg-purple-100 text-purple-800"
      case "presence":
        return "bg-orange-100 text-orange-800"
      case "settings":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case "payment":
        return "Thanh toán"
      case "invoice":
        return "Hóa đơn"
      case "member":
        return "Thành viên"
      case "presence":
        return "Ngày ở"
      case "settings":
        return "Cài đặt"
      default:
        return "Khác"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString("vi-VN"),
      time: date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    filterHistory(term, filterType)
  }

  const handleFilterChange = (type: string) => {
    setFilterType(type)
    filterHistory(searchTerm, type)
  }

  const filterHistory = (search: string, type: string) => {
    let filtered = mockHistoryData

    if (type !== "all") {
      filtered = filtered.filter((item) => item.type === type)
    }

    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.description.toLowerCase().includes(search.toLowerCase()) ||
          item.user.toLowerCase().includes(search.toLowerCase()),
      )
    }

    setFilteredHistory(filtered)
  }

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
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Lọc theo loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="payment">Thanh toán</SelectItem>
                <SelectItem value="invoice">Hóa đơn</SelectItem>
                <SelectItem value="member">Thành viên</SelectItem>
                <SelectItem value="presence">Ngày ở</SelectItem>
                <SelectItem value="settings">Cài đặt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History Timeline */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Không tìm thấy hoạt động nào</p>
              </div>
            ) : (
              filteredHistory.map((item, index) => {
                const { date, time } = formatTimestamp(item.timestamp)
                return (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-border last:border-b-0">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full ${getActionColor(item.type)}`}>{getActionIcon(item.type)}</div>
                      {index < filteredHistory.length - 1 && <div className="w-px h-12 bg-border mt-2"></div>}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className={getActionColor(item.type)}>
                              {getActionTypeLabel(item.type)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {date} • {time}
                            </span>
                          </div>
                          <p className="font-medium text-foreground mb-1">{item.description}</p>

                          {/* Action details */}
                          {item.details && (
                            <div className="text-sm text-muted-foreground">
                              {item.type === "payment" && (
                                <span>Số tiền: {item.details.amount?.toLocaleString("vi-VN")}đ</span>
                              )}
                              {item.type === "invoice" && item.details.oldAmount && (
                                <span>
                                  Thay đổi từ {item.details.oldAmount?.toLocaleString("vi-VN")}đ →{" "}
                                  {item.details.newAmount?.toLocaleString("vi-VN")}đ
                                </span>
                              )}
                              {item.type === "member" && <span>Thành viên: {item.details.memberName}</span>}
                              {item.type === "presence" && item.details.dateRange && (
                                <span>Khoảng thời gian: {item.details.dateRange}</span>
                              )}
                              {item.type === "settings" && item.details.oldRate && (
                                <span>
                                  Giá cũ: {item.details.oldRate?.toLocaleString("vi-VN")}đ/ngày → Giá mới:{" "}
                                  {item.details.newRate?.toLocaleString("vi-VN")}đ/ngày
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* User info */}
                        <div className="flex items-center gap-2 text-sm">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="text-xs">
                              {item.user
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground">{item.user}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Load More */}
      {filteredHistory.length > 0 && (
        <div className="text-center">
          <Button variant="outline">Xem thêm hoạt động</Button>
        </div>
      )}
    </div>
  )
}
