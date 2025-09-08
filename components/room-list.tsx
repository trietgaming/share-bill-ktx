"use client"

import { RoomCard } from "./room-card"
import { IRoom } from "@/types/Room";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserRooms } from "@/lib/actions/room";
import { useQuery } from "@tanstack/react-query";


export function RoomList() {
  const { data: rooms, isLoading, error } = useQuery<IRoom[]>({
    queryKey: ['user-rooms'],
    queryFn: getUserRooms
  })

  const router = useRouter();

  const handleRoomClick = (roomId: string) => {
    router.push(`/room/${roomId}`)
  }

  if (isLoading) {
    return <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-32 w-full rounded-md" />
      ))}
    </div>
  }

  if (error) {
    toast.error("Đã có lỗi xảy ra khi tải danh sách phòng.");
    return <div className="text-red-500">Đã có lỗi xảy ra khi tải danh sách phòng.</div>
  }

  return (
    <div className="grid gap-4">
      {rooms?.map((room) => (
        <RoomCard key={room._id} room={room} onClick={handleRoomClick} />
      ))}
    </div>

  )
}
