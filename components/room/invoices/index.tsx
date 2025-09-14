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
import { InvoiceForm } from "@/components/room/invoices/invoice-form"
import { useInvoices, useRoomQuery } from "../room-context"
import { IInvoice } from "@/types/Invoice"
import { useAuth } from "@/components/auth-context"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useMutation } from "@tanstack/react-query"
import { deleteInvoice } from "@/lib/actions/invoice"
import { queryClient } from "@/lib/query-client"
import { InvoiceSkeleton } from "./skeleton"
import { CreateMonthInvoiceForm } from "./create-month-invoice-form"
import { Skeleton } from "@/components/ui/skeleton"
import { InvoiceCard } from "./invoice-card"
import { toast } from "sonner"

interface PersonalInvoice extends IInvoice {
  personalAmount: number
}


export function InvoicesManagement() {

  const { userData } = useAuth();
  const { data: room } = useRoomQuery();
  const { pendingInvoicesQuery: { data: invoices }, otherInvoices, monthlyInvoices } = useInvoices();

  const [addInvoiceType, setAddInvoiceType] = useState<IInvoice["type"] | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<IInvoice | null>(null)

  const thisMonthInvoicesAmount = useMemo(() => {
    const now = new Date();
    return invoices?.filter(invoice => {
      const createdAt = invoice.createdAt
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).reduce((sum, invoice) => (invoice.status === "pending" ? sum + invoice.amount : sum), 0) || 0;
  }, [invoices]);

  const deleteInvoiceMutation = useMutation({
    mutationKey: ['delete-invoice'],
    mutationFn: async (invoice: IInvoice) => {
      // Call delete API
      await deleteInvoice(invoice._id);
      queryClient.setQueriesData<IInvoice[]>(
        { queryKey: ['invoices', invoice.roomId] },
        old => old?.filter(inv => inv._id !== invoice._id) || []
      );
    },
    onError: () => {
      toast.error("Có lỗi xảy ra khi xoá hóa đơn.");
      queryClient.invalidateQueries({ queryKey: ['invoices', room._id] });
    }
  });

  // Calculate totals
  const totalYourShare = otherInvoices?.reduce((sum, invoice) => (sum + invoice.personalAmount), 0) || 0

  const totalRoomUnpaid = invoices?.reduce((sum, invoice) => (invoice.remainingAmount), 0) || 0

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
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalYourShare)}</div>
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

              <Button onClick={() => {
                setAddInvoiceType("walec");
                setEditingInvoice(null);
              }} variant="ghost" className="w-full justify-start">
                <Zap className="mr-2 h-4 w-4" />
                <span>Hóa đơn điện nước</span>
              </Button>

            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Button onClick={() => {
                setAddInvoiceType("roomCost");
                setEditingInvoice(null);
              }} variant="ghost" className="w-full justify-start">
                <Home className="mr-2 h-4 w-4" />
                <span>Tiền phòng</span>
              </Button>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Button onClick={() => {
                setAddInvoiceType("other");
                setEditingInvoice(null);
              }} variant="ghost" className="w-full justify-start">
                <Receipt className="mr-2 h-4 w-4" />
                <span>Hóa đơn khác</span>
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={!!addInvoiceType} onOpenChange={() => { setAddInvoiceType(null); setEditingInvoice(null) }}>
          <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Thêm hóa đơn mới</DialogTitle>
              <DialogDescription>Tạo hóa đơn mới cho phòng.</DialogDescription>
            </DialogHeader>
            <InvoiceForm invoice={editingInvoice} type={addInvoiceType!} onSuccess={() => { setEditingInvoice(null); setAddInvoiceType(null) }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monthlyInvoices.map((invoice) => (
          <InvoiceCard key={invoice._id} invoice={invoice} onEdit={
            (inv) => {
              setAddInvoiceType(inv.type); setEditingInvoice(inv)
            }
          } onDelete={deleteInvoiceMutation.mutateAsync} />
        ))}

        {/* Other Invoices */}
        {otherInvoices.map((invoice) => (
          <InvoiceCard key={invoice._id} invoice={invoice} onEdit={
            (inv) => {
              setAddInvoiceType(inv.type); setEditingInvoice(inv)
            }
          } onDelete={deleteInvoiceMutation.mutateAsync} />
        ))}
      </div>


    </div>
  )
}
