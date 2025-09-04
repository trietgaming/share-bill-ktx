import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Receipt, Calendar, Users, ChevronDown } from "lucide-react"

export function SubNavbar() {
  return (
    <div className="border-b border-border bg-card">
      <div className="flex h-14 items-center gap-4 px-6">
        {/* Add Room Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Thêm phòng
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <Plus className="mr-2 h-4 w-4" />
              Tạo phòng mới
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              Gia nhập phòng
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Bills Button */}
        <Button variant="outline" className="gap-2 bg-transparent">
          <Receipt className="h-4 w-4" />
          Xem hóa đơn
        </Button>

        {/* Fill Check-in Date Button */}
        <Button variant="outline" className="gap-2 bg-transparent">
          <Calendar className="h-4 w-4" />
          Điền ngày ở
        </Button>
      </div>
    </div>
  )
}
