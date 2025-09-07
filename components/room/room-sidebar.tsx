"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UserPlus, Settings, Shield, Users, DollarSign, Bell, Download, Upload, BarChart3, X } from "lucide-react"

interface RoomSidebarProps {
  onClose?: () => void
}

export function RoomSidebar({ onClose }: RoomSidebarProps) {
  return (
    <div className="w-full lg:w-80 h-full lg:h-auto border-l border-border bg-sidebar overflow-y-auto">
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
            <Button className="w-full justify-start bg-transparent text-sm" variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Gửi thông báo
            </Button>
          </CardContent>
        </Card>

        {/* Room Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Thông tin phòng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 lg:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm text-muted-foreground">Mã phòng</span>
              <Badge variant="secondary" className="text-xs">
                A101
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm text-muted-foreground">Số thành viên</span>
              <Badge variant="default" className="text-xs">
                3/4
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm text-muted-foreground">Trạng thái</span>
              <Badge variant="default" className="bg-green-500 text-xs">
                Hoạt động
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm text-muted-foreground">Tiền phòng</span>
              <span className="font-medium text-sm">3.000.000đ/tháng</span>
            </div>
          </CardContent>
        </Card>

        {/* Room Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
              <Settings className="h-4 lg:h-5 w-4 lg:w-5" />
              Cài đặt phòng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
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
            </Accordion>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
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
        </Card>

        {/* Admin Settings */}
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
              <BarChart3 className="h-4 w-4 mr-2" />
              Báo cáo tháng
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
              <Settings className="h-4 w-4 mr-2" />
              Cài đặt hệ thống
            </Button>
            <Separator />
            <Button variant="destructive" className="w-full justify-start text-sm">
              Xóa phòng
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
