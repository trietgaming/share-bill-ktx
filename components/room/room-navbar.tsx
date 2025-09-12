"use client"
import { cn } from "@/lib/utils"
import { Home, Receipt, Calendar, History } from "lucide-react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface RoomNavbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "dashboard", label: "Bảng điều khiển", icon: Home },
  { id: "invoices", label: "Hóa đơn", icon: Receipt },
  { id: "attendance", label: "Tích ngày ở", icon: Calendar },
  { id: "history", label: "Lịch sử thay đổi", icon: History },
]

export function RoomNavbar() {
  const pathname = usePathname();
  const basePath = pathname.split("/").slice(0, 3).join("/");

  const activeTab = pathname.split("/")[3] || "dashboard";

  return (
    <nav className="border-b border-border bg-card">
      <div className="flex h-14 items-center px-4 md:px-6">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                asChild
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={"flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-colors whitespace-nowrap flex-shrink-0"}
              >
                <Link prefetch href={`${basePath}/${tab.id}`} key={tab.id}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden xs:inline sm:inline">{tab.label}</span>
                </Link>
              </Button>
            )
          })}
        </div>
      </div>
    </nav >
  )
}
