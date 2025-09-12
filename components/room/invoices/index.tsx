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
import { Plus, MoreHorizontal, Edit, Trash2, CreditCard, Receipt, DollarSign, Users, User, ChevronDown, Zap, Home } from "lucide-react"
import { CreateOtherInvoiceForm } from "@/components/room/invoices/create-other-invoice-form"
import { useInvoicesQuery } from "../room-context"
import { IInvoice } from "@/types/Invoice"
import { useAuth } from "@/components/auth-context"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useMutation } from "@tanstack/react-query"
import { deleteInvoice } from "@/lib/actions/invoice"
import { queryClient } from "@/lib/query-client"
import { InvoiceSkeleton } from "./skeleton"
import { CreateMonthInvoiceForm } from "./create-month-invoice-form"

interface PersonalInvoice extends IInvoice {
  personalAmount: number
}


export function InvoicesManagement() {

  const { userData } = useAuth();
  const { data: invoices } = useInvoicesQuery();

  const [addInvoiceType, setAddInvoiceType] = useState<string | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)

  const personalInvoices: PersonalInvoice[] = useMemo(() => {
    return invoices?.filter((invoice) => invoice.applyTo.includes(userData!._id))
      .map((invoice) => ({
        ...invoice,
        personalAmount: Math.round(invoice.amount / invoice.applyTo.length),
      })) || []
  }, [invoices, userData]);

  const thisMonthInvoicesAmount = useMemo(() => {
    const now = new Date();
    return invoices?.filter(invoice => {
      const createdAt = invoice.createdAt
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).reduce((sum, invoice) => (invoice.status === "pending" ? sum + invoice.amount : sum), 0) || 0;
  }, [invoices]);

  // Calculate totals
  const totalYourShare = personalInvoices?.reduce((sum, invoice) => (invoice.status === "pending" ? sum + invoice.personalAmount : sum), 0) || 0

  const totalRoomUnpaid = invoices?.reduce((sum, invoice) => (invoice.status === "pending" ? sum + invoice.amount : sum), 0) || 0

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoice: IInvoice) => {
      // Call delete API
      await deleteInvoice(invoice._id);
      queryClient.invalidateQueries({ queryKey: ['invoices', invoice.roomId] });
    }
  })

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
        <DropdownMenuItem disabled={deleteInvoiceMutation.isPending} onClick={() => deleteInvoiceMutation.mutate(invoice)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Xóa hóa đơn
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (!invoices || !userData) return <InvoiceSkeleton />

  return (
    <div className="space-y-6">
      {/* Header with Summary and Add Button */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hóa đơn tháng này</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(thisMonthInvoicesAmount)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phần của bạn</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalYourShare.toLocaleString("vi-VN")}đ</div>
              {/* <p className="text-xs text-muted-foreground">Từ hóa đơn chung</p> */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Còn lại cả phòng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRoomUnpaid)}</div>
              {/* <p className="text-xs text-muted-foreground">Hóa đơn chung chưa thanh toán</p> */}
            </CardContent>
          </Card>
        </div>

        {/* Add Invoice Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline-block">Thêm hóa đơn</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>

              <Button onClick={() => setAddInvoiceType("walec")} variant="ghost" className="w-full justify-start">
                <Zap className="mr-2 h-4 w-4" />
                <span>Hóa đơn điện nước</span>
              </Button>

            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Button onClick={() => setAddInvoiceType("roomCost")} variant="ghost" className="w-full justify-start">
                <Home className="mr-2 h-4 w-4" />
                <span>Tiền phòng</span>
              </Button>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Button onClick={() => setAddInvoiceType("other")} variant="ghost" className="w-full justify-start">
                <Receipt className="mr-2 h-4 w-4" />
                <span>Hóa đơn khác</span>
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={addInvoiceType === "other"} onOpenChange={() => setAddInvoiceType(null)}>
          <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Thêm hóa đơn mới</DialogTitle>
              <DialogDescription>Tạo hóa đơn mới cho phòng.</DialogDescription>
            </DialogHeader>
            <CreateOtherInvoiceForm onSuccess={() => setAddInvoiceType(null)} />
          </DialogContent>
        </Dialog>

        <Dialog open={!!addInvoiceType && addInvoiceType !== "other"} onOpenChange={() => setAddInvoiceType(null)}>
          <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Thêm hóa đơn mới</DialogTitle>
              <DialogDescription>Tạo hóa đơn mới cho phòng.</DialogDescription>
            </DialogHeader>
            <CreateMonthInvoiceForm invoiceType={addInvoiceType as string} onSuccess={() => setAddInvoiceType(null)} />
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
                <TableHead>Phần của bạn</TableHead>
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
                  <TableCell className="font-medium">{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell className="font-medium text-primary">{formatCurrency(invoice.personalAmount)}</TableCell>
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
              {invoices.map((invoice) => (
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
