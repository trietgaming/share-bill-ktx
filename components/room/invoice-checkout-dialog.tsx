"use client";

import { IInvoice, PersonalInvoice } from "@/types/invoice";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "../ui/form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRoommatesQuery } from "./room-context";
import { useMutation } from "@tanstack/react-query";
import { IClientBankAccount } from "@/types/bank-account";
import { Switch } from "@/components/ui/switch";
import { Label } from "../ui/label";
import { payInvoice } from "@/lib/actions/invoice";
import { toast } from "sonner";
import { queryClient } from "@/lib/query-client";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useBanks } from "@/hooks/use-banks";

const invoiceCheckoutFormSchema = z.object({
    invoiceId: z.string().min(1, "Invoice ID is required"),
    amount: z.coerce.number<number>().min(0, "Amount must be at least 0"),
});

export function PayQRCodeCard({ account }: { account: IClientBankAccount }) {
    return <div className="border rounded-lg flex flex-col items-center">
        <h3 className="text-center mb-2 mt-4">{account.bankName}</h3>
        <img src={account.qrCodeUrl} alt="QR Code" className="w-32 h-32 object-contain mb-4" />
    </div>
}

export function BankAccountCard({ account }: { account: IClientBankAccount }) {
    const { getBankLogoByShortName } = useBanks();

    return <div className="flex flex-col items-center gap-4 border rounded-lg p-4">
        <div className="*:text-center">
            <img alt="Bank logo" className="h-8 object-cover mx-auto" src={getBankLogoByShortName(account.bankName)} />
            <h3 className="font-medium">{account.bankName}</h3>
            <p className="text-sm md:text-base text-foreground font-mono break-all">{account.accountNumber}</p>
            <p className="text-sm text-muted-foreground truncate">{account.accountName}</p>
        </div>
        <img
            src={`https://img.vietqr.io/image/${account.bankName}-${account.accountNumber}-qr_only.jpg}`}
            alt="Mã QR thanh toán"
            className="w-24 h-24 object-contain border rounded-lg bg-white"

        />
    </div>

}

export function InvoiceCheckoutDialog({ invoice, ...props }: React.ComponentProps<typeof Dialog> & { invoice?: PersonalInvoice | null }) {

    const { data: roommates, isLoading: isRoommatesLoading } = useRoommatesQuery();

    const receiver = roommates?.find(rm => rm.userId === invoice?.payTo);

    const [isPaidCheck, setIsPaidCheck] = useState(false);
    const [isPaidAll, setIsPaidAll] = useState(true);

    const form = useForm<z.infer<typeof invoiceCheckoutFormSchema>>({
        resolver: zodResolver(invoiceCheckoutFormSchema),
        defaultValues: {
            invoiceId: invoice?._id,
            amount: invoice?.personalAmount,
        },

    })

    useEffect(() => {
        form.reset({
            invoiceId: invoice?._id,
            amount: invoice?.personalAmount,
        });
        setIsPaidCheck(false);
        setIsPaidAll(true);
    }, [invoice, form]) // Reset form when invoice changes

    const { mutateAsync: onSubmit } = useMutation({
        mutationFn: async (data: z.infer<typeof invoiceCheckoutFormSchema>) => {
            await payInvoice(data.invoiceId, data.amount);
            queryClient.invalidateQueries({ queryKey: ['invoices', invoice!.roomId] });
        },
        onSuccess: () => {
            props.onOpenChange?.(false);
            toast.success(`Thanh toán hóa đơn ${invoice?.name} thành công!`);
        },
        onError: (error: any) => {
            if (error?.message) {
                toast.error(`Đã có lỗi xảy ra khi cập nhật thanh toán: ${error.message}`);
            }
        }
    })

    function handleSubmit() {
        const value = form.getValues()
        if (value.amount > invoice!.personalAmount) {
            form.setError("amount", { message: "Số tiền không được lớn hơn số tiền phải trả." });
            return;
        }
        return onSubmit(value);
    }

    if (isRoommatesLoading || !invoice) {
        return <Dialog><DialogContent>Loading...</DialogContent></Dialog>
    }

    return <Dialog {...props}>
        <DialogContent className="sm:max-w-lg space-y-4">
            <DialogHeader>
                <DialogTitle>Thanh toán hóa đơn</DialogTitle>
                <DialogDescription>
                    Chuyển khoản vào một trong các tài khoản bên dưới, khi chuyển xong, tích xác nhận và gửi.
                </DialogDescription>
            </DialogHeader>
            <h4 className="font-bold mx-auto">Số tiền: {formatCurrency(invoice?.personalAmount)}</h4>
            <Tabs defaultValue={receiver?.bankAccounts[0]?._id}>
                {receiver?.bankAccounts.length! > 1 &&
                    <TabsList>
                        {receiver?.bankAccounts.map((account, index) => (
                            <TabsTrigger key={account._id} value={account._id}>
                                {account.bankName}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                }
                {receiver?.bankAccounts.map((account) => (
                    <TabsContent key={account._id} value={account._id} className="mt-2">
                        {account.qrCodeUrl
                            ? <PayQRCodeCard account={account} />
                            : <BankAccountCard account={account} />}
                    </TabsContent>
                ))}
            </Tabs>
            <div className="flex items-center gap-4">
                <Label htmlFor="isPaid" className="text-sm font-medium">Tôi đã thanh toán</Label>
                <Switch id="isPaid" checked={isPaidCheck} onCheckedChange={setIsPaidCheck} />
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => props.onOpenChange?.(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={
                            !isPaidCheck || form.formState.isSubmitting || form.formState.isSubmitSuccessful
                        }>
                            Thanh toán
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
}