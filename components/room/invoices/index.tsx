"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Receipt,
    DollarSign,
    Users,
    User,
    ChevronDown,
    Zap,
    Home,
    PlusIcon,
    Menu,
    Ellipsis,
    CircleCheck,
} from "lucide-react";
import { InvoiceForm } from "@/components/room/invoices/invoice-form";
import { useInvoices, useRoomQuery } from "../contexts/room-context";
import { IInvoice } from "@/types/invoice";
import { useAuth } from "@/components/auth-context";
import { formatCurrency } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { deleteInvoice } from "@/lib/actions/invoice";
import { invoicesQueryKey, queryClient } from "@/lib/query-client";
import { InvoiceSkeleton } from "./skeleton";
import { InvoiceCard } from "./invoice-card";
import { toast } from "sonner";
import { handleAction } from "@/lib/action-handler";
import {
    AddInvoiceButton,
    AddOtherInvoiceButton,
    AddRoomCostInvoiceButton,
    AddWalecInvoiceButton,
} from "../add-invoice-button";

export function InvoicesManagement() {
    const { userData } = useAuth();
    const { data: room } = useRoomQuery();
    const {
        pendingInvoicesQuery: { data: invoices },
        otherInvoices,
        monthlyInvoices,
        setAddInvoiceType,
        setEditingInvoice,
    } = useInvoices();

    const deleteInvoiceMutation = useMutation({
        mutationKey: ["delete-invoice"],
        mutationFn: async (invoice: IInvoice) => {
            await handleAction(deleteInvoice(invoice._id));
            queryClient.setQueriesData<IInvoice[]>(
                { queryKey: invoicesQueryKey(room._id) },
                (old) => old?.filter((inv) => inv._id !== invoice._id) || []
            );
        },
        onError: (error) => {
            toast.error("Có lỗi xảy ra khi xoá hóa đơn.", {
                description: error?.message,
            });
            queryClient.invalidateQueries({
                queryKey: invoicesQueryKey(room._id),
            });
        },
    });

    // Calculate totals
    const totalYourShare =
        otherInvoices
            .concat(monthlyInvoices)
            ?.reduce((sum, invoice) => sum + invoice.personalAmount, 0) || 0;

    const totalRoomUnpaid =
        invoices?.reduce((sum, invoice) => sum + invoice.remainingAmount, 0) ||
        0;

    if (!invoices || !userData) return <InvoiceSkeleton />;

    return (
        <div className="space-y-6">
            {/* Header with Summary and Add Button */}
            <div className="flex gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="outline">
                            <Ellipsis className="w-5 h-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="*:w-full *:flex *:gap-4 *:items-center">
                        <DropdownMenuItem asChild>
                            <Button
                                variant="ghost"
                                className="w-full"
                            >
                                <CircleCheck className="w-5 h-5"/>
                                <span>Xem hóa đơn đã hoàn thành</span>
                            </Button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AddInvoiceButton />
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tổng hóa đơn đang chờ
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">
                                {formatCurrency(
                                    invoices.reduce(
                                        (sum, inv) => sum + inv.amount,
                                        0
                                    )
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tổng thanh toán của bạn
                            </CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">
                                {formatCurrency(totalYourShare)}
                            </div>
                            {/* <p className="text-xs text-muted-foreground">Từ hóa đơn chung</p> */}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Còn lại cả phòng
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(totalRoomUnpaid)}
                            </div>
                            {/* <p className="text-xs text-muted-foreground">Hóa đơn chung chưa thanh toán</p> */}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {monthlyInvoices.map((invoice) => (
                    <InvoiceCard
                        key={invoice._id}
                        invoice={invoice}
                        onEdit={(inv) => {
                            setAddInvoiceType(inv.type);
                            setEditingInvoice(inv);
                        }}
                        onDelete={deleteInvoiceMutation.mutateAsync}
                    />
                ))}

                {/* Other Invoices */}
                {otherInvoices.map((invoice) => (
                    <InvoiceCard
                        key={invoice._id}
                        invoice={invoice}
                        onEdit={(inv) => {
                            setAddInvoiceType(inv.type);
                            setEditingInvoice(inv);
                        }}
                        onDelete={deleteInvoiceMutation.mutateAsync}
                    />
                ))}
            </div>
        </div>
    );
}
