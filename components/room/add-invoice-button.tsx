import { Plus, ChevronDown, Zap, Home, Receipt } from "lucide-react";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useInvoices } from "./contexts/invoices-context";
import { cn } from "@/lib/utils";

export function AddOtherInvoiceButton({
    ...props
}: React.ComponentProps<typeof Button>) {
    const { setAddInvoiceType, setEditingInvoice } = useInvoices();
    return (
        <Button
            variant="ghost"
            {...props}
            onClick={(e) => {
                setAddInvoiceType("other");
                setEditingInvoice(null);
                props.onClick?.(e);
            }}
        >
            <Receipt className="mr-2 h-4 w-4" />
            <span>Hóa đơn khác</span>
        </Button>
    );
}

export function AddWalecInvoiceButton({
    ...props
}: React.ComponentProps<typeof Button>) {
    const { setAddInvoiceType, setEditingInvoice } = useInvoices();
    return (
        <Button
            variant="ghost"
            {...props}
            onClick={(e) => {
                setAddInvoiceType("walec");
                setEditingInvoice(null);
                props.onClick?.(e);
            }}
        >
            <Zap className="mr-2 h-4 w-4" />
            <span>Tiền điện nước</span>
        </Button>
    );
}

export function AddRoomCostInvoiceButton({
    ...props
}: React.ComponentProps<typeof Button>) {
    const { setAddInvoiceType, setEditingInvoice } = useInvoices();

    return (
        <Button
            variant="ghost"
            {...props}
            onClick={(e) => {
                setAddInvoiceType("roomCost");
                setEditingInvoice(null);
                props.onClick?.(e);
            }}
        >
            <Home className="mr-2 h-4 w-4" />
            <span>Tiền phòng</span>
        </Button>
    );
}

export function AddInvoiceButton({
    className,
    ...props
}: React.ComponentProps<typeof Button>) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className={cn("gap-2", className)} {...props}>
                    <Plus className="h-4 w-4" />
                    <span className="inline-block">Thêm hóa đơn</span>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem asChild>
                    <AddWalecInvoiceButton className="w-full justify-start" />
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <AddRoomCostInvoiceButton className="w-full justify-start" />
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <AddOtherInvoiceButton className="w-full justify-start" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
