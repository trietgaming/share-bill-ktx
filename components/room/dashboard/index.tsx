"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Zap, Receipt, Calendar, CheckCircle, XCircle, AlertCircle, DollarSign, Home } from "lucide-react"
import { useInvoices, useMonthPresenceQuery, useRoomQuery, useRoommatesQuery } from "@/components/room/room-context"
import RoomateList from "./roomate-list"
import { useMemo } from "react"
import { cn, formatCurrency, toYYYYMM } from "@/lib/utils"

export function HomeDashboard() {
  const { data: room } = useRoomQuery();
  const {
    monthlyInvoices,
    otherInvoices,
    openInvoiceCheckoutDialog
  } = useInvoices();

  const thisMonthElectricInvoice = useMemo(() => {
    return monthlyInvoices?.find(invoice => invoice.type === "walec" && invoice.monthApplied === toYYYYMM(new Date()));
  }, [monthlyInvoices])


  const thisMonthInvoices = useMemo(() => {
    return monthlyInvoices?.filter(invoice => invoice.monthApplied === toYYYYMM(new Date()) && invoice.personalAmount);
  }, [monthlyInvoices])


  const { data: thisMonthPresence } = useMonthPresenceQuery();

  const presenceStatus = useMemo(() => {
    if (!thisMonthPresence) return { processed: 0, unprocessed: 0, totalDays: 0 };

    const currentDate = new Date();
    const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    let processed = 0;
    for (let day = 0; day < totalDays; day++) {
      processed += thisMonthPresence.every(roommatePresence => roommatePresence.presence[day] !== "undetermined") ? 1 : 0;
    }

    const unprocessed = totalDays - processed;
    return { processed, unprocessed, totalDays };
  }, [thisMonthPresence]);

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
            {thisMonthElectricInvoice
              ? <>
                <div className={cn("text-lg md:text-2xl font-bold", thisMonthElectricInvoice.status === "paid" ? "text-success" : "text-destructive")}>
                  {formatCurrency(thisMonthElectricInvoice.amount)}
                </div>
                <p className="text-xs text-muted-foreground">{
                  thisMonthElectricInvoice.status === "pending" ? `Đã thanh toán ${formatCurrency(thisMonthElectricInvoice.amount - thisMonthElectricInvoice.remainingAmount)}` :
                    thisMonthElectricInvoice.status === "paid" ? "Đã thanh toán" : "Đã hết hạn"
                }</p>
              </>
              : "Chưa có hóa đơn tháng này"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Hóa đơn khác</CardTitle>
            <Receipt className="h-3 md:h-4 w-3 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-destructive">
              {formatCurrency(otherInvoices.reduce((sum, inv) => sum + (inv.personalAmount || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Chưa thanh toán</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Ngày ở</CardTitle>
            <Calendar className="h-3 md:h-4 w-3 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-primary">
              {presenceStatus.processed}/{presenceStatus.totalDays}
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

        {/* Invoices Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Receipt className="h-4 md:h-5 w-4 md:w-5" />
              Tình trạng hóa đơn của bạn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            {thisMonthInvoices.map((invoice) => (
              <div key={invoice._id} className="p-3 md:p-4 border border-destructive/30 bg-destructive/15 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {invoice.type === "walec"
                      ? <Zap className="h-4 w-4 text-foreground/70" />
                      : <Home className="h-4 w-4 text-foreground/70" />}
                    <span className="font-medium text-sm md:text-base text-foreground">
                      {invoice.name}
                    </span>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" />
                    Chưa đóng
                  </Badge>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-base md:text-lg font-bold text-foreground">
                    {formatCurrency(invoice.personalAmount)}
                  </span>
                  <Button size="sm" variant="default" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Thanh toán
                  </Button>
                </div>
                {invoice.dueDate &&
                  <p className="text-xs text-foreground/70 mt-1">Hạn thanh toán: {invoice.dueDate.toLocaleDateString("vi-VN")}</p>
                }
              </div>))}

            {/* Other Invoices */}
            {!!otherInvoices.length &&
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Hóa đơn khác</h4>
                {otherInvoices.map((invoice) => (
                  <div key={invoice._id} className="flex items-center justify-between p-2 md:p-3 border rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-medium text-sm truncate">{invoice.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-medium text-sm">{formatCurrency(invoice.personalAmount)}</span>
                      <Button onClick={() => openInvoiceCheckoutDialog(invoice)} size="sm" variant="outline" className="text-xs bg-transparent">
                        Thanh toán
                      </Button>
                    </div>
                  </div>
                ))}
              </div>}
          </CardContent>
        </Card>
      </div>

      {/* Presence Status */}
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
              <div className="text-xl md:text-2xl font-bold text-foreground">{presenceStatus.processed}</div>
              <p className="text-xs md:text-sm text-muted-foreground">Ngày đã xử lý</p>
            </div>
            <div className="text-center p-3 md:p-4 bg-muted rounded-lg border-l-4 border-destructive">
              <div className="text-xl md:text-2xl font-bold text-foreground">{presenceStatus.unprocessed}</div>
              <p className="text-xs md:text-sm text-muted-foreground">Ngày chưa xử lý</p>
            </div>
            <div className="text-center p-3 md:p-4 bg-muted rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-foreground">{presenceStatus.totalDays}</div>
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
