"use client";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { IRoom } from "@/types/room";
import { Button } from "../ui/button";
import { Clock, Hash, Loader2, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState } from "react";
import { joinRoom } from "@/lib/actions/room";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { handleAction } from "@/lib/action-handler";

export function ConfirmJoinRoomPage({
    room,
    token,
}: {
    room: IRoom;
    token?: string;
}) {
    const [isJoining, setIsJoining] = useState(false);
    const router = useRouter();

    const handleJoinRoom = async () => {
        setIsJoining(true);
        try {
            await handleAction(joinRoom(room._id, token));
            router.push(`/room/${room._id}`);
            toast.success("Tham gia phòng thành công!");
        } catch (error: any) {
            setIsJoining(false);
            toast.error(`Đã có lỗi xảy ra khi tham gia phòng`, {
                description: error?.message,
            });
        }
    };

    return (
        <div className="min-h-[80vh] bg-background flex items-center justify-center">
            <Card className="w-full max-w-md mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle>
                        Bạn có muốn tham gia phòng <b>{room.name}</b> không?
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 *:flex *:items-center *:gap-1 *:text-muted-foreground *:text-sm">
                    <div>
                        <Hash className="w-4 h-4" />
                        <span className="">ID phòng: {room._id}</span>
                    </div>
                    <div>
                        <Users className="w-4 h-4" />
                        <span className="">
                            Thành viên: {room.members.length}/{room.maxMembers}
                        </span>
                    </div>
                    <div>
                        <Clock className="w-4 h-4" />
                        <span className="">
                            Tạo vào: {formatDate(new Date(room.createdAt))}
                        </span>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2 justify-end">
                    <Link href="/" className="text-sm text-primary">
                        <Button variant={"ghost"}>Quay lại</Button>
                    </Link>
                    <Button disabled={isJoining} onClick={handleJoinRoom}>
                        Tham gia
                        <span>
                            {isJoining && (
                                <Loader2 className="animate-spin ml-2" />
                            )}
                        </span>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
