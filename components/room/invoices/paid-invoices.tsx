"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Receipt,
    Zap,
    Home,
} from "lucide-react";
import Link from "next/link";
import { useRoomQuery, useRoommates } from "../contexts/room-context";
import { getInvoicesByRoom } from "@/lib/actions/invoice";
import { handleAction } from "@/lib/action-handler";
import { paidInvoicesQueryKey } from "@/lib/query-client";
import { IInvoice, PersonalInvoice } from "@/types/invoice";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/components/auth-context";
import { UserAvatar } from "@/components/user-avatar";
import { InvoiceSkeleton } from "./skeleton";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const typeConfig = {
    walec: {
        icon: Zap,
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
        label: "Điện nước",
    },
    roomCost: {
        icon: Home,
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
        label: "Tiền phòng",
    },
    other: {
        icon: Receipt,
        color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
        label: "Khác",
    },
};

function PaidInvoiceCard({ invoice }: { invoice: IInvoice }) {
    const { userData } = useAuth();
    const {
        roommatesQuery: { data: roommates },
    } = useRoommates();

    const config = typeConfig[invoice.type];
    const Icon = config.icon;
    const creator = roommates?.find((rm) => rm.userId === invoice.createdBy);
    const myPayInfo = invoice.payInfo?.find((p) => p.paidBy === userData!._id);
    const totalPaid = invoice.payInfo?.reduce((sum, p) => sum + p.amount, 0) || 0;

    return (
        <Card className="w-full transition-all duration-200 hover:shadow-md border-green-200 dark:border-green-800">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", config.color)}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-card-foreground truncate">
                                {invoice.name}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                                {invoice.description}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Hoàn thành</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Amount Information */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                            Tổng hóa đơn
                        </span>
                        <span className="font-semibold text-card-foreground">
                            {formatCurrency(invoice.amount)}
                        </span>
                    </div>
                    {myPayInfo && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                                Bạn đã trả
                            </span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(myPayInfo.amount)}
                            </span>
                        </div>
                    )}
                    <div className="w-full bg-green-200 dark:bg-green-900/40 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: "100%" }}
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
                                    <UserAvatar
                                        className="w-4 h-4"
                                        user={creator}
                                    />
                                    <span className="text-muted-foreground text-xs">
                                        Tạo bởi <b>{creator.displayName}</b> vào{" "}
                                        {formatDate(invoice.createdAt)}
                                    </span>
                                </div>
                            )}
                            <Separator />
                            {invoice.payInfo.map((payInfo) => {
                                const roommate = roommates?.find(
                                    (rm) => rm.userId === payInfo.paidBy
                                );
                                if (!roommate) return null;
                                return (
                                    <div
                                        key={roommate.userId}
                                        className="flex items-center gap-2 justify-between text-muted-foreground text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <UserAvatar
                                                className="w-4 h-4"
                                                user={roommate}
                                            />
                                            <span>
                                                <b>{roommate.displayName}</b> đã
                                                thanh toán
                                            </span>
                                        </div>
                                        <b>{formatCurrency(payInfo.amount)}</b>
                                    </div>
                                );
                            })}
                            <div className="text-muted-foreground text-xs flex justify-between">
                                Tổng đã trả:
                                <b className="text-green-600 dark:text-green-400">
                                    {formatCurrency(totalPaid)}
                                </b>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {/* Completed Date */}
                {invoice.updatedAt && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Hoàn thành vào {formatDate(invoice.updatedAt)}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function PaidInvoices() {
    const { data: room } = useRoomQuery();
    const { userData } = useAuth();

    const paidInvoicesQuery = useQuery<IInvoice[]>({
        queryKey: paidInvoicesQueryKey(room._id),
        queryFn: () =>
            handleAction(
                getInvoicesByRoom(room._id, {
                    status: "paid",
                    sortBy: "createdAt",
                    sortOrder: "desc",
                })
            ),
    });

    if (paidInvoicesQuery.isLoading || !userData) {
        return <InvoiceSkeleton />;
    }

    const invoices = paidInvoicesQuery.data || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href={`/room/${room._id}/invoices`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-xl font-bold">Hóa đơn đã hoàn thành</h2>
                    <p className="text-sm text-muted-foreground">
                        {invoices.length} hóa đơn đã thanh toán
                    </p>
                </div>
            </div>

            {/* Invoice List */}
            {invoices.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center">
                            Chưa có hóa đơn nào được hoàn thành
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {invoices.map((invoice) => (
                        <PaidInvoiceCard key={invoice._id} invoice={invoice} />
                    ))}
                </div>
            )}
        </div>
    );
}