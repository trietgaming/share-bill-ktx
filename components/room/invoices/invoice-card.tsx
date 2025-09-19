import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Home, Receipt, Calendar, Pencil, Trash } from "lucide-react"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { IInvoice, PersonalInvoice } from "@/types/invoice"
import { UserAvatar } from "@/components/user-avatar"
import { useInvoices, useMembership, useRoommatesQuery } from "../room-context"
import { useConfirm } from "@/components/are-you-sure"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import { hasPermission } from "@/lib/permission"
import { useAuth } from "@/components/auth-context"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"

const typeConfig = {
    walec: {
        icon: Zap,
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    },
    roomCost: {
        icon: Home,
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    },
    other: {
        icon: Receipt,
        color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    },
}

export function InvoiceCard({
    invoice,
    onEdit,
    onDelete,
    ...props
}: React.ComponentProps<typeof Card> & {
    invoice: PersonalInvoice,
    onEdit: (invoice: IInvoice) => void,
    onDelete: (invoice: IInvoice) => Promise<any>,
}) {
    const { data: roommates } = useRoommatesQuery();
    const { openInvoiceCheckoutDialog } = useInvoices();
    const { userData } = useAuth();
    const membership = useMembership();

    console.log(invoice);

    const config = typeConfig[invoice.type]
    const Icon = config.icon
    const isOverdue = invoice.dueDate && invoice.dueDate < new Date()
    const isPaid = invoice.isPaidByMe;
    const creator = roommates?.find(rm => rm.userId === invoice.createdBy);
    const [isDeleting, setIsDeleting] = useState(false);

    const handlePayInvoice = () => {
        openInvoiceCheckoutDialog(invoice);
    }

    const handleEditInvoice = () => {
        onEdit(invoice);
    }

    const handleDeleteInvoice = useConfirm(async () => {
        try {
            setIsDeleting(true);
            await onDelete(invoice);
        } finally {
            setIsDeleting(false);
        }
    }, {
        title: "Xoá hóa đơn",
        description: "Bạn có chắc chắn muốn xoá hóa đơn này? Hành động này không thể hoàn tác.",
        confirmText: "Xoá",
        variant: "destructive",
    })

    return (
        <Card className={cn("w-full transition-all duration-200 hover:shadow-md", props.className)}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", config.color)}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-card-foreground truncate">{invoice.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{invoice.description}</p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Amount Information */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tổng thanh toán</span>
                        <span className="font-semibold text-card-foreground">{formatCurrency(invoice.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Phần của bạn</span>
                        <span className={cn("font-semibold", isPaid ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                            {formatCurrency(invoice.personalAmount)}
                        </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((invoice.amount - invoice.remainingAmount) / invoice.amount) * 100}%` }}
                        />
                    </div>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="details">
                        <AccordionTrigger className="py-0">
                            Thông tin chi tiết
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 mt-4">
                            {creator && (
                                <div className="flex items-center gap-2">
                                    <UserAvatar className="w-4 h-4" user={creator} />
                                    <span className="text-muted-foreground text-xs">Tạo bởi <b>{creator.displayName}</b> vào {formatDate(invoice.createdAt)}</span>
                                </div>
                            )}
                            <Separator />
                            {invoice.payInfo.map(payInfo => {
                                const roommate = roommates?.find(rm => rm.userId === payInfo.paidBy);
                                if (!roommate) return null;
                                return (
                                    <div key={roommate.userId} className="flex items-center gap-2 justify-between text-muted-foreground text-xs">
                                        <div className="flex items-center gap-2">
                                            <UserAvatar className="w-4 h-4" user={roommate} />
                                            <span>
                                                <b>{roommate.displayName}</b> đã thanh toán
                                            </span>
                                        </div>
                                        <b>{formatCurrency(payInfo.amount)}</b>
                                    </div>
                                )
                            })}
                            <div className="text-muted-foreground text-xs flex justify-between">
                                Tổng đã trả:
                                <b>
                                    {formatCurrency(Math.round(invoice.amount - invoice.remainingAmount))}/{formatCurrency(invoice.amount)}
                                </b>
                            </div>
                        </AccordionContent>

                    </AccordionItem>
                </Accordion>

                {/* Status and Due Date */}
                <div className="flex items-center justify-between text-sm">
                    {invoice.dueDate && (
                        <div
                            className={cn(
                                "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                                isOverdue && !isPaid
                                    ? "bg-destructive/10 text-destructive"
                                    : isPaid
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                        : "bg-muted text-muted-foreground",
                            )}
                        >
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(invoice.dueDate)}</span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                {isDeleting
                    ? <Skeleton className="h-8 w-full rounded-md" />
                    : <div className={"flex gap-2 pt-2"}>
                        {isPaid ?
                            (
                                <div className="text-center">
                                    <Button disabled className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                        ✓ Bạn đã thanh toán
                                    </Button>
                                </div>
                            ) : (
                                <Button disabled={!invoice.payTo} onClick={handlePayInvoice} size="sm" className="flex-1 text-primary" variant="outline">
                                    {invoice.payTo ? "Thanh toán" : "Không có người nhận"}
                                </Button>
                            )}
                        <Button onClick={handleEditInvoice} size="icon" variant="outline"><Pencil /></Button>
                        {(invoice.createdBy === userData!._id || hasPermission("room.invoice.delete", membership?.role)) &&
                            <Button onClick={handleDeleteInvoice} size="icon" variant="outline" className="text-destructive">
                                <Trash />
                            </Button>}
                    </div>
                }
            </CardContent>
        </Card>
    )
}
