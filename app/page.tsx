import { SubNavbar } from "@/components/sub-navbar"
import { RoomList } from "@/components/room-list"

export default function RoomManagementApp() {

  return (
    <div className="min-h-screen bg-background">
      <SubNavbar />

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Danh sách phòng</h2>
          <p className="text-muted-foreground">Quản lý và theo dõi các phòng của bạn</p>
        </div>
        <RoomList />
      </div>
      
    </div>
  )
}
