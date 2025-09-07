"use client"

import { Navbar } from "@/components/navbar"
import { SubNavbar } from "@/components/sub-navbar"
import { RoomList } from "@/components/room-list"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"

export default function RoomManagementApp() {
  const router = useRouter();
  const { userData } = useAuth()

  const handleRoomClick = (roomId: string) => {
    router.push(`/room/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <SubNavbar />
      <RoomList roomsJoined={userData?.roomsJoined || []} onRoomClick={handleRoomClick} />
    </div>
  )
}
