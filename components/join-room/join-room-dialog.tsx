import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import JoinRoomForm from "./join-room-form";
import { DialogTitle } from "@radix-ui/react-dialog";

export default function JoinRoomDialog({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gia nhập phòng</DialogTitle>
                    <DialogDescription>Nhập ID hoặc liên kết phòng để tham gia</DialogDescription>
                </DialogHeader>
                <JoinRoomForm />
            </DialogContent>
        </Dialog>
    )
}