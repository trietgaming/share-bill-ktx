import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { InvoiceForm } from "@/components/room/invoices/invoice-form";
import { useInvoices } from "./contexts/invoices-context";

export function InvoiceDialog() {
    const {
        addInvoiceType,
        setAddInvoiceType,
        setEditingInvoice,
        editingInvoice,
    } = useInvoices();
    
    return (
        <Dialog
            open={!!addInvoiceType}
            onOpenChange={() => {
                setAddInvoiceType(null);
            }}
        >
            {/* Use onCloseAutoFocus to smooth out the transition in closing edit mode */}
            <DialogContent
                onCloseAutoFocus={() => {
                    setEditingInvoice(null);
                }}
                className="max-w-lg overflow-y-auto max-h-[90vh]"
            >
                <DialogHeader>
                    <DialogTitle>
                        {editingInvoice
                            ? "Chỉnh sửa hóa đơn"
                            : "Thêm hóa đơn mới"}
                    </DialogTitle>
                    <DialogDescription>
                        {editingInvoice
                            ? "Chỉnh sửa thông tin hóa đơn."
                            : "Tạo hóa đơn mới cho phòng."}
                    </DialogDescription>
                </DialogHeader>
                <InvoiceForm
                    invoice={editingInvoice}
                    type={addInvoiceType!}
                    onSuccess={() => {
                        setAddInvoiceType(null);
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
