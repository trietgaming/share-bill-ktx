"use client"
import { Home } from "lucide-react"
import { NotificationDropdown } from "./notification-dropdown"
import { UserMenu } from "./user-menu"
import { SettingsButton } from "./settings-button"
import { useAuth } from "./auth-context"
import Link from "next/link"

export function Navbar() {
  const { userData } = useAuth();

  if (!userData) return null;

  return (
    <nav className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - App Icon & Name */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground hidden md:block">RoomManager</h1>
        </Link>

        {/* Right side - Icons */}
        <div className="flex items-center gap-2">
          <SettingsButton />
          <NotificationDropdown />
          <UserMenu />
        </div>
      </div>
    </nav>
  )
}
