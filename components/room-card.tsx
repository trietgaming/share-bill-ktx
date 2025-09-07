"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { IRoom } from "@/types/Room"

interface RoomCardProps {
  room: IRoom
  onClick: (roomId: string) => void
}

export function RoomCard({ room, onClick }: RoomCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={() => onClick(room._id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{room.name}</CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {room.members.length}/{room.maxMembers}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-muted-foreground">Số thành viên: </span>
              <span className="font-medium">{room.members.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">ID phòng: </span>
              <span className="font-mono font-medium">{room._id}</span>
            </div>
          </div>
          <div className="text-primary font-medium">Xem chi tiết →</div>
        </div>
      </CardContent>
    </Card>
  )
}
