"use client"

import { useState } from "react"
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

// Mock data
const mockData = {
  sharedBills: [
    {
      id: 1,
      name: "Điện nước tháng 12/2023",
      amount: 1200000,
      yourShare: 400000,
      status: "unpaid",
      dueDate: "2024-01-15",
      type: "utility",
      description: "Hóa đơn điện nước chung của phòng",
    },
    {
      id: 2,
      name: "Internet tháng 12/2023",
      amount: 300000,
      yourShare: 100000,
      status: "paid",
      dueDate: "2024-01-10",
      type: "internet",
      description: "Cước internet WiFi chung",
    },
    {
      id: 3,
      name: "Vệ sinh chung tháng 12",
      amount: 150000,
      yourShare: 50000,
      status: "unpaid",
      dueDate: "2024-01-20",
      type: "cleaning",
      description: "Chi phí vệ sinh khu vực chung",
    },
  ],
  personalBills: [
    {
      id: 4,
      name: "Tiền phòng tháng 12/2023",
      amount: 3000000,
      status: "paid",
      dueDate: "2024-01-05",
      type: "rent",
      description: "Tiền thuê phòng hàng tháng",
    },
    {
      id: 5,
      name: "Phí gửi xe tháng 12",
      amount: 100000,
      status: "unpaid",
      dueDate: "2024-01-15",
      type: "parking",
      description: "Phí gửi xe máy tháng",
    },
  ],
}

export function BillsManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<any>(null)
  const [newBill, setNewBill] = useState({
    name: "",
    amount: "",
    dueDate: "",
    type: "shared",
    description: "",
  })

  const { sharedBills, personalBills } = mockData

  // Calculate totals
  const totalYourShare = sharedBills.reduce((sum, bill) => (bill.status === "unpaid" ? sum + bill.yourShare : sum), 0)
  const totalPersonalUnpaid = personalBills.reduce(
    (sum, bill) => (bill.status === "unpaid" ? sum + bill.amount : sum),
    0,
  )
  const totalYouNeedToPay = totalYourShare + totalPersonalUnpaid

  const totalRoomUnpaid = sharedBills.reduce((sum, bill) => (bill.status === "unpaid" ? sum + bill.amount : sum), 0)

  const handleAddBill = () => {
    console.log("Adding bill:", newBill)
    setIsAddDialogOpen(false)
    setNewBill({ name: "", amount: "", dueDate: "", type: "shared", description: "" })
  }

  const handlePayBill = (billId: number) => {
    console.log("Paying bill:", billId)
  }

  const handleEditBill = (bill: any) => {
    setEditingBill(bill)
  }

  const handleDeleteBill = (billId: number) => {
    console.log("Deleting bill:", billId)
  }

  const getBillTypeColor = (type: string) => {
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

  const BillActions = ({ bill, isShared }: { bill: any; isShared: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {bill.status === "unpaid" && (
          <DropdownMenuItem onClick={() => handlePayBill(bill.id)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Thanh toán
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleEditBill(bill)}>
          <Edit className="mr-2 h-4 w-4" />
          Sửa hóa đơn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDeleteBill(bill.id)} className="text-destructive">
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Thêm hóa đơn mới</DialogTitle>
              <DialogDescription>Tạo hóa đơn mới cho phòng. Chọn loại hóa đơn phù hợp.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Tên hóa đơn
                </Label>
                <Input
                  id="name"
                  value={newBill.name}
                  onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Số tiền
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={newBill.amount}
                  onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">
                  Hạn thanh toán
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newBill.dueDate}
                  onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Loại hóa đơn
                </Label>
                <select
                  id="type"
                  value={newBill.type}
                  onChange={(e) => setNewBill({ ...newBill, type: e.target.value })}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="shared">Hóa đơn chung</option>
                  <option value="personal">Hóa đơn riêng</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Mô tả
                </Label>
                <Textarea
                  id="description"
                  value={newBill.description}
                  onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddBill}>
                Thêm hóa đơn
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Shared Bills */}
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
                <TableHead>Phần của bạn</TableHead>
                <TableHead>Hạn thanh toán</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sharedBills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{bill.name}</div>
                      <div className="text-sm text-muted-foreground">{bill.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{bill.amount.toLocaleString("vi-VN")}đ</TableCell>
                  <TableCell className="font-medium text-primary">{bill.yourShare.toLocaleString("vi-VN")}đ</TableCell>
                  <TableCell>{bill.dueDate}</TableCell>
                  <TableCell>
                    <Badge variant={bill.status === "paid" ? "default" : "destructive"}>
                      {bill.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <BillActions bill={bill} isShared={true} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Personal Bills */}
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
              {personalBills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{bill.name}</div>
                      <div className="text-sm text-muted-foreground">{bill.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{bill.amount.toLocaleString("vi-VN")}đ</TableCell>
                  <TableCell>{bill.dueDate}</TableCell>
                  <TableCell>
                    <Badge variant={bill.status === "paid" ? "default" : "destructive"}>
                      {bill.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <BillActions bill={bill} isShared={false} />
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
