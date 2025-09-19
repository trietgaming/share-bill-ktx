"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Bell, X } from "lucide-react"
import { useNotification } from "./notification-context"
import { initializeNotification } from "@/lib/notification/notification"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Image from "next/image"

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
      <Button disabled={isRequesting} onClick={handleEnableNotifications} className="w-full">
        Bật thông báo ngay
      </Button>
    </div>
  )
}

export function NotificationList() {

  const {
    notifications,
    notificationQuery,
    removeNotification } = useNotification();

  const handleNotificationScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (
      target.scrollHeight - target.scrollTop < target.clientHeight &&
      notificationQuery.hasNextPage && !notificationQuery.isFetchingNextPage
    ) {
      notificationQuery.fetchNextPage();
    }
  }

  return <div className="space-y-2 max-h-[70vh] overflow-y-auto overflow-x-hidden" onScroll={handleNotificationScroll}>
    {notifications.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center">Chưa có thông báo nào</p>
    ) : (
      notifications.map((notification) => (
        <div key={notification._id}
          className={cn(
            "relative p-3 rounded-lg flex flex-row gap-4 items-center",
            notification.status === "unread" ? "bg-background border" : "bg-muted"
          )}
        >
          {notification.icon || notification.image
            ? <Image width={32} height={32} src={notification.icon! || notification.image!} className="w-8 h-8" alt="Noti" />
            : <Bell className="w-8 h-8 text-muted-foreground" />}
          <div className="mr-6">
            <p className="text-sm">{notification.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date(notification.receivedAt).toLocaleString()}</p>
          </div>
          <Button size="icon" variant="ghost" className="rounded-full absolute top-0 right-0"
            onClick={() => removeNotification(notification._id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))
    )}
  </div>
}

export function NotificationDropdown() {
  const [showNotifications, setShowNotifications] = useState(false);
  const {
    isNotificationPermissionGranted,
    notifications,
    clearAllNotifications,
    notificationQuery,
  } = useNotification();

  return (
    <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 &&
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5  max-w-8 rounded-full p-0 text-xs">
              {notifications.length}{notificationQuery.hasNextPage ? '+' : ''}
            </Badge>
          }
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-screen md:max-w-sm md:min-w-[300px]">
        <div className="p-4 space-y-4 w-full">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Thông báo</h3>
            <Button size="sm" variant="outline" hidden={notifications.length === 0}
              onClick={clearAllNotifications}
            >
              Xóa tất cả
            </Button>
          </div>
          {!isNotificationPermissionGranted ? (
            <NotificationPrompt />
          ) : (
            <NotificationList />
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
