"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"

const mockNotifications = [
  { id: 1, message: "Phòng A1 có khách mới check-in", time: "5 phút trước" },
  { id: 2, message: "Hóa đơn tháng 12 đã sẵn sàng", time: "1 giờ trước" },
  { id: 3, message: "Phòng C3 sắp hết hạn thuê", time: "2 giờ trước" },
]

export function NotificationDropdown() {
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
            {mockNotifications.length}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4">
          <h3 className="font-semibold mb-3">Thông báo</h3>
          <div className="space-y-2">
            {mockNotifications.map((notification) => (
              <div key={notification.id} className="p-3 rounded-lg bg-muted">
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
              </div>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
