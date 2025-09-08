import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import CreateRoomForm from "./create-room-form";
import { DialogTitle } from "@radix-ui/react-dialog";

export default function CreateRoomDialog({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tạo phòng</DialogTitle>
                    <DialogDescription>Điền các thông tin bên dưới để tạo phòng.</DialogDescription>
                </DialogHeader>
                <CreateRoomForm />
            </DialogContent>
        </Dialog>
    )
}