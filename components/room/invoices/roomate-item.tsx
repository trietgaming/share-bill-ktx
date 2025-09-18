import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Roommate } from "@/types/roommate";

export function RoommateItem({ roommate, myselfId }: { roommate: Roommate, myselfId?: string | undefined }) {
    return (
        <div className="flex items-center">
            <Avatar className="w-5 h-5 mr-2">
                <AvatarImage src={roommate.photoUrl || undefined} alt={roommate.displayName || "Avatar"} />
                <AvatarFallback>{roommate.displayName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            {roommate.displayName} {roommate.userId === myselfId && "(Bạn)"}
        </div>
    )
}