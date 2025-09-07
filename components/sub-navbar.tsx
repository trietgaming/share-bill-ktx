import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Receipt, Calendar, Users, ChevronDown } from "lucide-react"
import Link from "next/link"

export function SubNavbar() {
  return (
    <div className="border-b border-border bg-card">
      <div className="flex h-14 items-center gap-4 px-6">
        {/* Add Room Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline-block">Thêm phòng</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link href="/room/create">
                <Plus className="mr-2 h-4 w-4" />
                <span>Tạo phòng mới</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/room/join">
                <Users className="mr-2 h-4 w-4" />
                <span>Gia nhập phòng</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Bills Button */}
        <Button variant="outline" className="gap-2 bg-transparent">
          <Receipt className="h-4 w-4" />
          <span className="hidden md:inline-block">Xem hóa đơn</span>
        </Button>

        {/* Fill Check-in Date Button */}
        <Button variant="outline" className="gap-2 bg-transparent">
          <Calendar className="h-4 w-4" />
          <span className="hidden md:inline-block">Điền ngày ở</span>
        </Button>
      </div>
    </div>
  )
}
