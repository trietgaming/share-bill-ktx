"use client"

import { IRoomJoined } from "@/types/UserData"
import { RoomCard } from "./room-card"

interface RoomListProps {
  roomsJoined: IRoomJoined[]
  onRoomClick: (roomId: string) => void
}

export function RoomList({ roomsJoined, onRoomClick }: RoomListProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Danh sách phòng</h2>
        <p className="text-muted-foreground">Quản lý và theo dõi các phòng của bạn</p>
      </div>

      <div className="grid gap-4">
        {roomsJoined.map(({ room }) => (
          <RoomCard key={room._id} room={room} onClick={onRoomClick} />
        ))}
      </div>
    </div>
  )
}
