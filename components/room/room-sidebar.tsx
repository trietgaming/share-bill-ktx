"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UserPlus, Settings, Shield, Users, DollarSign, Bell, Download, Upload, BarChart3, X, TriangleAlert } from "lucide-react"
import { useConfirm } from "@/components/are-you-sure"
import { useRoomQuery, useMembership } from "./room-context"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { deleteRoom, leaveRoom } from "@/lib/actions/room"
import { useRouter } from "next/navigation"

interface RoomSidebarProps {
  onClose?: () => void
}

export function RoomSidebar({ onClose }: RoomSidebarProps) {
  const { data: room } = useRoomQuery();
  const membership = useMembership();

  const router = useRouter();

  const { mutate: handleDeleteRoom, isPending: isDeletingRoom, error: deleteRoomError, isSuccess: isDeleteRoomSuccess } = useMutation({
    mutationFn: async () => {
      await deleteRoom(room._id);
      router.push('/');
    },
    onError: (error) => {
      console.error("Error deleting room:", error);
      toast.error("Đã có lỗi xảy ra khi xóa phòng.");
    }
  })

  const { mutate: handleLeaveRoom, isPending: isLeavingRoom, error: leaveRoomError, isSuccess: isLeaveRoomSuccess } = useMutation({
    mutationFn: async () => {
      await leaveRoom(room._id);
      router.push('/');
    },
    onError: (error) => {
      console.error("Error leaving room:", error);
      toast.error("Đã có lỗi xảy ra khi rời phòng.");
    }
  })

  const confirmDeleteRoom = useConfirm(handleDeleteRoom, {
    title: "Bạn có chắc chắn muốn xóa phòng này?",
    description: "Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến phòng sẽ bị xóa vĩnh viễn.",
    variant: "destructive",
    confirmText: "Xóa",
  })

  const confirmLeaveRoom = useConfirm(handleLeaveRoom, {
    title: "Bạn có chắc chắn muốn rời phòng này?",
    // Handle admin leaving the room text
    description: "Bạn có thể tham gia lại phòng nếu có lời mời hoặc mã phòng, hoặc khi được cho phép.",
    confirmText: "Rời phòng",
  })

  return (
    <div className="w-full lg:w-80 h-full bg-sidebar overflow-y-auto">
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Menu</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
              <Users className="h-4 lg:h-5 w-4 lg:w-5" />
              Hành động nhanh
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 lg:space-y-3">
            <Button className="w-full justify-start bg-transparent text-sm" variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Thêm thành viên
            </Button>
            <Button className="w-full justify-start bg-transparent text-sm" variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Thêm hóa đơn
            </Button>
          </CardContent>
        </Card>

        {/* Room Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
              <Settings className="h-4 lg:h-5 w-4 lg:w-5" />
              Cài đặt
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="general">
                <AccordionTrigger className="text-sm">Cài đặt chung</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start text-xs lg:text-sm">
                    Thông tin phòng
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-xs lg:text-sm">
                    Quy định phòng
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-xs lg:text-sm">
                    Thông báo tự động
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="billing">
                <AccordionTrigger className="text-sm">Cài đặt hóa đơn</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start text-xs lg:text-sm">
                    Giá điện nước
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-xs lg:text-sm">
                    Chu kỳ thanh toán
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-xs lg:text-sm">
                    Phương thức thanh toán
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="members">
                <AccordionTrigger className="text-sm">Quản lý thành viên</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start text-xs lg:text-sm">
                    Danh sách thành viên
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-xs lg:text-sm">
                    Phân quyền
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-xs lg:text-sm">
                    Lời mời tham gia
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion> */}
          </CardContent>
        </Card>

        {/* Data Management */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
              <BarChart3 className="h-4 lg:h-5 w-4 lg:w-5" />
              Dữ liệu & Báo cáo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 lg:space-y-3">
            <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
              <Upload className="h-4 w-4 mr-2" />
              Nhập dữ liệu
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Thống kê tháng
            </Button>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
              <TriangleAlert className="h-4 lg:h-5 w-4 lg:w-5" />
              Nguy hiểm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 lg:space-y-3">
            <Button disabled={isLeavingRoom || isLeaveRoomSuccess} onClick={() => confirmLeaveRoom()} variant="destructive" className="w-full justify-start text-sm">
              Rời phòng
            </Button>
          </CardContent>
        </Card>

        {/* Admin Settings */}
        {membership?.role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                <Shield className="h-4 lg:h-5 w-4 lg:w-5" />
                Quản trị viên
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 lg:space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
                <Shield className="h-4 w-4 mr-2" />
                Quản lý quyền
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
                <Settings className="h-4 w-4 mr-2" />
                Cài đặt hệ thống
              </Button>
              <Separator />
              <Button disabled={isDeletingRoom || isDeleteRoomSuccess} onClick={() => confirmDeleteRoom()} variant="destructive" className="w-full justify-start text-sm">
                Xóa phòng
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
