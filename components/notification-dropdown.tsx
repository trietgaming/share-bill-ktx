"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { useNotification } from "./notification-context"
import { initializeNotification } from "@/lib/notification"
import { toast } from "sonner"

export function NotificationPrompt() {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      await initializeNotification();
    } catch (error) {
      console.error("Error enabling notifications:", error);
      toast.error("Không thể bật thông báo. Vui lòng thử lại sau.");
    }
    setIsRequesting(false);
  }

  return (
    <div className="flex flex-col items-center text-center space-y-4 p-0">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Bell className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Bạn chưa bật thông báo</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bật thông báo để không bỏ lỡ những cập nhật quan trọng và tin tức mới nhất
        </p>
      </div>

      {/* Enable button */}
      <Button onClick={handleEnableNotifications} className="w-full">
        Bật thông báo ngay
      </Button>
    </div>
  )
}


export function NotificationDropdown() {
  const { isNotificationPermissionGranted, notifications } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 &&
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              {notifications.length}
            </Badge>
          }
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4">
          <h3 className="font-semibold mb-3">Thông báo</h3>
          {!isNotificationPermissionGranted ? (
            <NotificationPrompt />
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-3 rounded-lg bg-muted">
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                </div>
              ))}
            </div>
          )
          }
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
