import { IInvoice } from "@/types/Invoice";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "../ui/form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRoommatesQuery } from "./room-context";
import { useMutation } from "@tanstack/react-query";
import { IClientBankAccount } from "@/types/BankAccount";
import { Switch } from "@/components/ui/switch";
import { Label } from "../ui/label";

const invoiceCheckoutFormSchema = z.object({
    invoiceId: z.string().min(1, "Invoice ID is required"),
});

export function PayQRCodeCard({ url }: { url: string }) {
    return <div className="border rounded-lg p-4 flex flex-col items-center">
        <img src={url} alt="QR Code" className="w-32 h-32 object-contain mb-4" />
    </div>
}

export function BankAccountCard({ account }: { account: IClientBankAccount }) {
    return <div className="flex flex-col-reverse sm:flex-row items-center gap-4 border rounded-lg p-4">
        <img
            src={`https://img.vietqr.io/image/${account.bankName}-${account.accountNumber}-qr_only.jpg}`}
            alt="Mã QR thanh toán"
            className="w-24 h-24 object-contain border rounded-lg bg-white"

        />
        <div>
            <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xs font-medium truncate">{account.bankName}</h3>
            </div>
            <p className="text-sm md:text-base text-foreground font-mono break-all">{account.accountNumber}</p>
            <p className="text-sm text-muted-foreground truncate">{account.accountName}</p>
        </div>
    </div>

}

export function InvoiceCheckoutDialog({ invoice, ...props }: React.ComponentProps<typeof Dialog> & { invoice?: IInvoice | null }) {

    const { data: roommates, isLoading: isRoommatesLoading } = useRoommatesQuery();

    const receiver = roommates?.find(rm => rm.userId === invoice?.payTo);
    console.log("Receiver:", receiver);

    const [isPaidCheck, setIsPaidCheck] = useState(false);

    const form = useForm<z.infer<typeof invoiceCheckoutFormSchema>>({
        resolver: zodResolver(invoiceCheckoutFormSchema),
        defaultValues: {
            invoiceId: invoice?._id,
        }
    })

    const { mutateAsync: onSubmit } = useMutation({
        mutationFn: async (data: z.infer<typeof invoiceCheckoutFormSchema>) => {
            // Call API to checkout invoice
            alert(`Checking out invoice: ${data.invoiceId}`);
        }
    })

    function handleSubmit() {
        return onSubmit(form.getValues());
    }

    if (isRoommatesLoading) {
        return <div>Loading...</div>
    }

    return <Dialog {...props}>
        <DialogContent className="sm:max-w-lg space-y-4">
            <DialogHeader>
                <DialogTitle>Thanh toán hóa đơn</DialogTitle>
                <DialogDescription>
                    Chuyển khoản vào một trong các tài khoản bên dưới, khi chuyển xong, tích xác nhận và gửi.
                </DialogDescription>
            </DialogHeader>
            {receiver?.bankAccounts.length
                ? receiver.bankAccounts.map((account, index) => {
                    const isQrAccount = !!account.qrCodeUrl;
                    return isQrAccount
                        ? <PayQRCodeCard key={index} url={account.qrCodeUrl!} />
                        : <BankAccountCard key={index} account={account} />
                })
                : <div className="text-sm text-muted-foreground">Người nhận chưa có tài khoản ngân hàng để nhận thanh toán.</div>}

            <div className="flex items-center gap-4">
                <Label htmlFor="isPaid" className="text-sm font-medium">Tôi đã thanh toán</Label>
                <Switch id="isPaid" checked={isPaidCheck} onCheckedChange={setIsPaidCheck} />
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <DialogFooter>
                        <Button variant="outline" onClick={() => props.onOpenChange?.(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={
                            !isPaidCheck || form.formState.isSubmitting || form.formState.isSubmitSuccessful
                        }>
                            Gửi
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
}