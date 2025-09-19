// Creating walec and roomCost invoices

"use client";
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl, FormDescription } from "@/components/ui/form"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { CreateInvoiceFormData, createNewInvoice } from "@/lib/actions/invoice"
import { useRoommatesQuery, useRoomQuery } from "../room-context"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CurrencyInput } from "@/components/currency-input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-context"
import { useState } from "react"
import { Roommate } from "@/types/roommate"
import { formatDate } from "@/lib/utils"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"
import { IInvoice } from "@/types/invoice";
import { toast } from "sonner";
import { queryClient } from "@/lib/query-client";
import { RoommateItem } from "./roomate-item";
import { handleAction } from "@/lib/action-handler";
import { ServerActionError } from "@/lib/errors";

const payInfoSchema = z.object({
    paidBy: z.string().min(1, "Người trả trước là bắt buộc"),
    paidAt: z.date("Ngày trả trước là bắt buộc"),
    amount: z.coerce.number<number>().positive("Số tiền phải lớn hơn 0"),
})

const createInvoiceFormSchema = z.object({
    roomId: z.string().min(1, "ID phòng là bắt buộc"),
    amount: z.coerce.number<number>().positive("Số tiền phải lớn hơn 0"),
    type: z.enum<CreateInvoiceFormData["type"][]>(["walec", "roomCost"]),
    monthApplied: z.string().min(1, "Tháng áp dụng là bắt buộc").regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Tháng áp dụng phải có định dạng YYYY-MM"),
    name: z.string().min(1, "Tên là bắt buộc"),
    description: z.string(),
    dueDate: z.date().optional(),
    applyTo: z.array(z.string()).min(1, "Phải chọn ít nhất một người"),
    payTo: z.string().optional(),
    advancePayer: payInfoSchema.optional(),
})

type CreateInvoiceFormValues = z.infer<typeof createInvoiceFormSchema>

type CreateOtherInvoiceFormProps = {
    onSuccess?: (invoice: IInvoice) => void
    invoiceType: Omit<IInvoice['type'], 'other'>;
}

const getInvoiceNamesByType = (type: string, monthYear: string) => {
    const [year, month] = monthYear.split("-");
    if (type === "walec") {
        return `Tiền điện nước ${month}/${year}`;
    }
    if (type === "roomCost") {
        return `Tiền phòng ${month}/${year}`;
    }
    return "Tiền tháng " + month + "/" + year;
}

export function CreateMonthInvoiceForm({ onSuccess, invoiceType }: CreateOtherInvoiceFormProps) {
    const { data: room } = useRoomQuery();
    const { data: roommates } = useRoommatesQuery();
    const { userData } = useAuth();

    const [hasAdvancePayer, setHasAdvancePayer] = useState(false);
    const [isAdvancePayerPaysFullAmount, setIsAdvancePayerPaysFullAmount] = useState(true);

    if (!roommates) return <div>Loading...</div>;

    const form = useForm<CreateInvoiceFormValues>({
        resolver: zodResolver(createInvoiceFormSchema),
        defaultValues: {
            roomId: room._id,
            amount: 0,
            type: invoiceType as IInvoice['type'],
            name: getInvoiceNamesByType(invoiceType as string, new Date().toISOString().slice(0, 7)),
            description: "",
            monthApplied: new Date().toISOString().slice(0, 7),
            dueDate: undefined,
            applyTo: roommates.map(r => r.userId),
            advancePayer: undefined,
            payTo: undefined,
        },
    })

    useEffect(() => {
        form.setValue("name", getInvoiceNamesByType(invoiceType as string, form.getValues("monthApplied") as string));
    }, [invoiceType, form.watch("monthApplied")]);

    const { mutateAsync } = useMutation({
        mutationFn: async (values: CreateInvoiceFormData) => {
            const invoice = await handleAction(createNewInvoice(values));
            queryClient.invalidateQueries({ queryKey: ['invoices', room._id] });
            return invoice;
        },
        onSuccess: (data) => {
            form.reset();
            setHasAdvancePayer(false);
            setIsAdvancePayerPaysFullAmount(true);
            onSuccess?.(data);
        },
        onError: (error) => {
            console.error("Failed to create invoice:", error);
            toast.error("Đã có lỗi xảy ra khi tạo hóa đơn.",
                error instanceof ServerActionError ? { description: error.message } : undefined
            );
        }
    });

    async function onSubmit(values: CreateInvoiceFormValues) {
        return await mutateAsync(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Amount */}
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Số tiền*</FormLabel>
                            <FormControl>
                                <CurrencyInput className="" intlConfig={{ locale: "vi-VN", currency: "VND" }} placeholder="Nhập số tiền" value={field.value} onValueChange={(value: string | undefined) => field.onChange(value)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex items-center justify-between">
                    {/* Due Date */}
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Ngày hết hạn?</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className="justify-start text-left font-normal">
                                                {field.value ? formatDate(field.value) : <span>Chọn ngày (không bắt buộc)</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="p-0">
                                        <Calendar
                                            mode="single"
                                            captionLayout="dropdown"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            autoFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Description */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mô tả</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Viết mô tả chi tiết (không bắt buộc)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />


                {/* Month Applied */}
                <FormField control={form.control} name="monthApplied"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tháng áp dụng*</FormLabel>
                            <FormControl>
                                <div className="flex space-x-2">
                                    <Select onValueChange={(value) => {
                                        const [year, month] = field.value.split("-");
                                        field.onChange(`${year}-${value}`);
                                    }} defaultValue={field.value.split("-")[1]}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Tháng" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                                <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                                                    {month.toString().padStart(2, '0')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select onValueChange={(value) => {
                                        const [year, month] = field.value.split("-");
                                        field.onChange(`${value}-${month}`);
                                    }} defaultValue={field.value.split("-")[0]}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Năm" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />


                {/* Apply To */}
                <FormField
                    control={form.control}
                    name="payTo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Thanh toán cho</FormLabel>
                            <FormControl>
                                <Select disabled={hasAdvancePayer} onValueChange={(value) => {
                                    // if (value === "bank_account") {
                                    //     return;
                                    // }
                                    // if (value === "qr_code") {
                                    //     return;
                                    // }
                                    field.onChange(value);
                                }}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn một" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {roommates.map(r => (
                                            <SelectItem key={r.userId} value={r.userId}>
                                                <RoommateItem roommate={r} myselfId={userData?._id} />
                                            </SelectItem>
                                        ))}
                                        {/* <SelectItem value="bank_account">Tài khoản ngân hàng</SelectItem>
                                        <SelectItem value="qr_code">Mã QR</SelectItem> */}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* <div className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel htmlFor="hasAdvancePayer" className="mb-0">Ứng trước?</FormLabel>
                    <Switch id="hasAdvancePayer" checked={hasAdvancePayer} onCheckedChange={setHasAdvancePayer} />
                </div>

                {hasAdvancePayer && (
                    <div className="space-y-4 border rounded-lg p-4">
                        <h3 className="font-semibold">Thông tin người ứng trước</h3>
                        <FormField
                            control={form.control}
                            name="advancePayer.paidBy"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Người ứng trước*</FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn người ứng trước" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {roommates.map(r => (
                                                    <SelectItem key={r.userId} value={r.userId}>
                                                        <RoommateItem roommate={r} myselfId={userData?._id} />
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center space-x-2">
                            <FormLabel htmlFor="isAdvancePayerPaysFullAmount">Trả toàn bộ?</FormLabel>
                            <Switch id="isAdvancePayerPaysFullAmount" checked={isAdvancePayerPaysFullAmount} onCheckedChange={setIsAdvancePayerPaysFullAmount} />
                        </div>


                        {!isAdvancePayerPaysFullAmount && (
                            <FormField
                                control={form.control}
                                name="advancePayer.amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Khoản đã trả trước</FormLabel>
                                        <FormControl>
                                            <CurrencyInput value={field.value} onValueChange={value => field.onChange(value)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="advancePayer.paidAt"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Đã trả vào*</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant={"outline"} className="justify-start text-left font-normal">
                                                    {field.value ? formatDate(field.value) : <span>Chọn một ngày</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent align="start" className="p-0">
                                            <Calendar
                                                mode="single"
                                                captionLayout="dropdown"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                autoFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )} */}

                <Button disabled={form.formState.isSubmitting} type="submit">Thêm hóa đơn</Button>
            </form>
        </Form>
    )
}
