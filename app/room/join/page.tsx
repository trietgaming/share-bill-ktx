import JoinRoomForm from "@/components/join-room/join-room-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function JoinRoomPage() {
    return (
        <div className="min-h-[80vh] bg-background flex items-center justify-center">
            <Card className="w-full max-w-md mx-auto shadow-lg">
                <CardHeader>
                    <Link href="/" className="text-sm text-primary mb-2 inline-block">
                        &larr; Quay lại
                    </Link>
                    <CardTitle>Gia nhập phòng</CardTitle>
                </CardHeader>
                <CardContent>
                    <JoinRoomForm />  
                </CardContent>
            </Card>
        </div>
    )
}