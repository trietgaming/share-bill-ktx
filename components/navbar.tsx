"use client"
import { NotificationDropdown } from "./notification-dropdown"
import { UserMenu } from "./user-menu"
import { SettingsButton } from "./settings-button"
import { useAuth } from "./auth-context"
import Link from "next/link"
import Image from "next/image"

export function Navbar() {
  const { userData } = useAuth();

  if (!userData) return null;

  return (
    <nav className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - App Icon & Name */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Image width={128} height={128} src={"/logo-128.jpg"} alt="Logo"/>
          </div>
          <h1 className="text-xl font-semibold text-foreground hidden md:block">Share Bill KTX</h1>
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
