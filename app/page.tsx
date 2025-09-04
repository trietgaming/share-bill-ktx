"use client"

import { Navbar } from "@/components/navbar"
import { SubNavbar } from "@/components/sub-navbar"
import { RoomList } from "@/components/room-list"

// Mock data cho danh sách phòng
const mockRooms = [
  { id: "room-001", name: "Phòng Deluxe A1", members: 2, maxMembers: 4 },
  { id: "room-002", name: "Phòng Standard B2", members: 1, maxMembers: 2 },
  { id: "room-003", name: "Phòng Suite C3", members: 3, maxMembers: 6 },
  { id: "room-004", name: "Phòng Family D4", members: 4, maxMembers: 8 },
  { id: "room-005", name: "Phòng Executive E5", members: 1, maxMembers: 3 },
]

export default function RoomManagementApp() {
  const handleRoomClick = (roomId: string) => {
    // Để người dùng implement navigation
    console.log(`Navigate to /room/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SubNavbar />
      <RoomList rooms={mockRooms} onRoomClick={handleRoomClick} />
    </div>
  )
}
