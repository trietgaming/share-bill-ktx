import { Plus, ChevronDown, Zap, Home, Receipt } from "lucide-react";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useInvoices } from "./invoices-context";
import { cn } from "@/lib/utils";

export function AddInvoiceButton({
    className,
    ...props
}: React.ComponentProps<typeof Button>) {
    const { setAddInvoiceType, setEditingInvoice } = useInvoices();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    className={cn("gap-2", className)}
                    {...props}
                >
                    <Plus className="h-4 w-4" />
                    <span className="inline-block">Thêm hóa đơn</span>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem asChild>
                    <Button
                        onClick={() => {
                            setAddInvoiceType("walec");
                            setEditingInvoice(null);
                        }}
                        variant="ghost"
                        className="w-full justify-start"
                    >
                        <Zap className="mr-2 h-4 w-4" />
                        <span>Hóa đơn điện nước</span>
                    </Button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Button
                        onClick={() => {
                            setAddInvoiceType("roomCost");
                            setEditingInvoice(null);
                        }}
                        variant="ghost"
                        className="w-full justify-start"
                    >
                        <Home className="mr-2 h-4 w-4" />
                        <span>Tiền phòng</span>
                    </Button>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                    <Button
                        onClick={() => {
                            setAddInvoiceType("other");
                            setEditingInvoice(null);
                        }}
                        variant="ghost"
                        className="w-full justify-start"
                    >
                        <Receipt className="mr-2 h-4 w-4" />
                        <span>Hóa đơn khác</span>
                    </Button>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
