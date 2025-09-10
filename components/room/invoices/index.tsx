"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, MoreHorizontal, Edit, Trash2, CreditCard, Receipt, DollarSign, Users, User } from "lucide-react"
import { CreateInvoiceForm } from "@/components/room/invoices/create-invoice-form"
import { useInvoicesQuery } from "../room-context"
import { IInvoice } from "@/types/Invoice"
import { useAuth } from "@/components/auth-context"
import { formatDate } from "@/lib/utils"

interface PersonalInvoice extends IInvoice {
  personalAmount: number
}


export function InvoicesManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)

  const { userData } = useAuth();
  const { data: invoices } = useInvoicesQuery();

  if (!invoices || !userData) return <div>Loading...</div>

  const sharedInvoices = invoices;

  const personalInvoices: PersonalInvoice[] = useMemo(() => {
    return invoices
      .filter((invoice) => invoice.applyTo.includes(userData!._id))
      .map((invoice) => ({
        ...invoice,
        personalAmount: Math.round(invoice.remainingAmount / invoice.applyTo.length),
      }))
  }, [invoices])
  // Calculate totals
  const totalYourShare = personalInvoices.reduce((sum, invoice) => (invoice.status === "pending" ? sum + invoice.personalAmount : sum), 0)
  const totalPersonalUnpaid = personalInvoices.reduce(
    (sum, invoice) => (invoice.status === "pending" ? sum + invoice.amount : sum),
    0,
  )
  const totalYouNeedToPay = totalYourShare + totalPersonalUnpaid

  const totalRoomUnpaid = sharedInvoices.reduce((sum, invoice) => (invoice.status === "pending" ? sum + invoice.amount : sum), 0)

  const getInvoiceTypeColor = (type: string) => {
    switch (type) {
      case "utility":
        return "bg-blue-100 text-blue-800"
      case "internet":
        return "bg-purple-100 text-purple-800"
      case "cleaning":
        return "bg-green-100 text-green-800"
      case "rent":
        return "bg-orange-100 text-orange-800"
      case "parking":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const InvoiceActions = ({ invoice, isShared }: { invoice: any; isShared: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {invoice.status === "pending" && (
          <DropdownMenuItem onClick={() => handlePayInvoice(invoice.id)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Thanh toán
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
          <Edit className="mr-2 h-4 w-4" />
          Sửa hóa đơn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDeleteInvoice(invoice.id)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Xóa hóa đơn
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-6">
      {/* Header with Summary and Add Button */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bạn cần trả</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{totalYouNeedToPay.toLocaleString("vi-VN")}đ</div>
              <p className="text-xs text-muted-foreground">Tổng hóa đơn chưa thanh toán</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phần của bạn</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalYourShare.toLocaleString("vi-VN")}đ</div>
              <p className="text-xs text-muted-foreground">Từ hóa đơn chung</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Còn lại cả phòng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRoomUnpaid.toLocaleString("vi-VN")}đ</div>
              <p className="text-xs text-muted-foreground">Hóa đơn chung chưa thanh toán</p>
            </CardContent>
          </Card>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="lg:w-auto w-full">
              <Plus className="mr-2 h-4 w-4" />
              Thêm hóa đơn
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Thêm hóa đơn mới</DialogTitle>
              <DialogDescription>Tạo hóa đơn mới cho phòng. Chọn loại hóa đơn phù hợp.</DialogDescription>
            </DialogHeader>
            <CreateInvoiceForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Personal Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Hóa đơn riêng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên hóa đơn</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Hạn thanh toán</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personalInvoices.map((invoice) => (
                <TableRow key={invoice._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.name}</div>
                      <div className="text-sm text-muted-foreground">{invoice.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{invoice.amount.toLocaleString("vi-VN")}đ</TableCell>
                  <TableCell>{invoice.dueDate ? formatDate(invoice.dueDate) : "Không"}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === "paid" ? "default" : "destructive"}>
                      {invoice.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <InvoiceActions invoice={invoice} isShared={false} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Shared Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Hóa đơn chung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên hóa đơn</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Hạn thanh toán</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sharedInvoices.map((invoice) => (
                <TableRow key={invoice._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.name}</div>
                      <div className="text-sm text-muted-foreground">{invoice.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{invoice.amount.toLocaleString("vi-VN")}đ</TableCell>
                  <TableCell>{invoice.dueDate ? formatDate(invoice.dueDate) : "Không"}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === "paid" ? "default" : "destructive"}>
                      {invoice.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <InvoiceActions invoice={invoice} isShared={true} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


    </div>
  )
}
