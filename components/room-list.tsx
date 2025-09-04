"use client"

import { RoomCard } from "./room-card"

interface Room {
  id: string
  name: string
  members: number
  maxMembers: number
}

interface RoomListProps {
  rooms: Room[]
  onRoomClick: (roomId: string) => void
}

export function RoomList({ rooms, onRoomClick }: RoomListProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Danh sách phòng</h2>
        <p className="text-muted-foreground">Quản lý và theo dõi các phòng của bạn</p>
      </div>

      <div className="grid gap-4">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} onClick={onRoomClick} />
        ))}
      </div>
    </div>
  )
}
