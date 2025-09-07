"use client"

import type React from "react"

import { useState } from "react"
import { RoomNavbar } from "./room-navbar"
import { RoomSidebar } from "./room-sidebar"
import { HomeDashboard } from "./home-dashboard"
import { BillsManagement } from "./bills-management"
import { AttendanceCalendar } from "./attendance-calendar"
import { HistoryLog } from "./history-log"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RoomLayoutProps {
  children?: React.ReactNode
}

export function RoomLayout({ children }: RoomLayoutProps) {
  const [activeTab, setActiveTab] = useState("home")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeDashboard />
      case "bills":
        return <BillsManagement />
      case "attendance":
        return <AttendanceCalendar />
      case "history":
        return <HistoryLog />
      default:
        return children
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Phòng A101</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Quản lý phòng trọ</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">Nguyễn Văn A</p>
              <p className="text-xs text-muted-foreground hidden sm:block">Quản trị viên</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <RoomNavbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex relative">
        <main className="flex-1 p-4 md:p-6">{renderTabContent()}</main>

        <div
          className={`
          fixed lg:relative top-0 left-0 h-full z-50 
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}
        >
          <RoomSidebar onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}
      </div>
    </div>
  )
}
