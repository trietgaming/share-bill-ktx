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
import { Roommate } from "@/types/Roommate"
import { formatDate } from "@/lib/utils"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"
import { IInvoice } from "@/types/Invoice";
import { toast } from "sonner";

const payInfoSchema = z.object({
    paidBy: z.string().min(1, "Người trả trước là bắt buộc"),
    paidAt: z.date("Ngày trả trước là bắt buộc"),
    amount: z.coerce.number<number>().positive("Số tiền phải lớn hơn 0"),
})

const createInvoiceFormSchema = z.object({
    roomId: z.string().min(1, "ID phòng là bắt buộc"),
    amount: z.coerce.number<number>().positive("Số tiền phải lớn hơn 0"),
    type: z.enum<CreateInvoiceFormData["type"][]>(["walec", "other", "roomCost"]),
    name: z.string().min(1, "Tên là bắt buộc"),
    description: z.string(),
    dueDate: z.date().optional(),
    applyTo: z.array(z.string()).min(1, "Phải chọn ít nhất một người"),
    advancePayer: payInfoSchema.optional(),
})

type CreateInvoiceFormValues = z.infer<typeof createInvoiceFormSchema>

function RoommateItem({ roommate, myselfId }: { roommate: Roommate, myselfId?: string | undefined }) {
    return (
        <div className="flex items-center">
            <Avatar className="w-5 h-5 mr-2">
                <AvatarImage src={roommate.photoUrl || undefined} alt={roommate.displayName || "Avatar"} />
                <AvatarFallback>{roommate.displayName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            {roommate.displayName} {roommate.userId === myselfId && "(Bạn)"}
        </div>
    )
}

export function CreateInvoiceForm({ onSuccess }: { onSuccess?: (invoice: IInvoice) => void }) {
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
            type: "other",
            name: "",
            description: "",
            dueDate: undefined,
            applyTo: roommates.map(r => r.userId),
            advancePayer: undefined,
        },
    })


    useEffect(() => {
        if (hasAdvancePayer) {
            form.setValue("advancePayer", {
                paidBy: userData?._id || "",
                amount: isAdvancePayerPaysFullAmount ? form.getValues("amount") : 0,
                paidAt: new Date(),
            });
        } else {
            form.setValue("advancePayer", undefined);
        }
    }, [hasAdvancePayer])

    useEffect(() => {
        if (!hasAdvancePayer) return;

        if (isAdvancePayerPaysFullAmount) {
            form.setValue("advancePayer.amount", form.getValues("amount"));
        } else {
            form.setValue("advancePayer.amount", 0);
        }
    }, [form.watch("amount"), isAdvancePayerPaysFullAmount, hasAdvancePayer])

    const { mutateAsync } = useMutation({
        mutationFn: createNewInvoice,
        onSuccess: (data) => {
            form.reset();
            setHasAdvancePayer(false);
            setIsAdvancePayerPaysFullAmount(true);
            onSuccess?.(data);
        },
        onError: (error) => {
            console.error("Failed to create invoice:", error);
            toast.error("Đã có lỗi xảy ra khi tạo hóa đơn.");
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

                {/* Type */}
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Loại hóa đơn*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn một loại" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="walec">Tiền điện nước</SelectItem>
                                    <SelectItem value="roomCost">Tiền phòng</SelectItem>
                                    <SelectItem value="other">Khác</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Name */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên hóa đơn*</FormLabel>
                            <FormControl>
                                <Input placeholder="Tiền điện nước tháng X" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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

                {/* Due Date */}
                <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Ngày hết hạn</FormLabel>
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

                {/* Apply To*/}
                <FormField
                    control={form.control}
                    name="applyTo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Áp dụng cho</FormLabel>
                            <FormControl>
                                <DropdownMenu >
                                    <FormControl>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline">
                                                {field.value?.length === roommates.length ? "Cả phòng" :
                                                    field.value?.map(
                                                        r => roommates.find(roommate => roommate.userId === r)?.displayName
                                                    ).join(", ") || "Chọn những người áp dụng"}
                                                <ChevronDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </FormControl>
                                    <DropdownMenuContent className="w-56">
                                        <DropdownMenuLabel>Chọn một hoặc nhiều người</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {roommates.map(r => (
                                            <DropdownMenuCheckboxItem
                                                key={r.userId}
                                                checked={field.value?.includes(r.userId)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        field.onChange([...(field.value || []), r.userId]);
                                                    } else {
                                                        field.onChange(field.value?.filter(v => v !== r.userId));
                                                    }
                                                }}
                                                onSelect={(e) => e.preventDefault()}
                                            >
                                                <RoommateItem roommate={r} myselfId={userData?._id} />
                                            </DropdownMenuCheckboxItem>
                                        ))}

                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </FormControl>
                            <FormDescription>Đã chọn {field.value?.length || 0} người chia hóa đơn</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />


                <div className="flex items-center justify-between rounded-lg border p-3">
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
                )}

                <Button disabled={form.formState.isSubmitting} type="submit">Thêm hóa đơn</Button>
            </form>
        </Form>
    )
}
