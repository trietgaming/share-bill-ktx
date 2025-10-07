"use client";
import { ControllerRenderProps, useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormControl,
    FormDescription,
} from "@/components/ui/form";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import {
    CreateInvoiceFormData,
    createNewInvoice,
    updateInvoice,
} from "@/lib/actions/invoice";
import { useRoommates, useRoomQuery } from "../contexts/room-context";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CurrencyInput } from "@/components/currency-input";
import { useAuth } from "@/components/auth-context";
import { ChangeEvent, useState } from "react";
import { formatCurrency, sum, toYYYYMM } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { IInvoice } from "@/types/invoice";
import { toast } from "sonner";
import { invoicesQueryKey, queryClient } from "@/lib/query-client";
import { RoommateItem } from "./roomate-item";
import { handleAction } from "@/lib/action-handler";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { InvoiceSplitMethod } from "@/enums/invoice";

const payInfoSchema = z.object({
    paidBy: z.string().min(1, "Người trả trước là bắt buộc"),
    paidAt: z.date("Ngày trả trước là bắt buộc"),
    amount: z.coerce.number<number>().positive("Số tiền phải lớn hơn 0"),
});

const invoiceFormSchema = z.object({
    roomId: z.string().min(1, "ID phòng là bắt buộc"),
    amount: z.coerce.number<number>().positive("Số tiền phải lớn hơn 0"),
    type: z.enum<CreateInvoiceFormData["type"][]>([
        "other",
        "roomCost",
        "walec",
    ]),
    monthApplied: z
        .string()
        .regex(
            /^\d{4}-(0[1-9]|1[0-2])$/,
            "Tháng áp dụng phải có định dạng YYYY-MM"
        )
        .optional(),
    name: z.string().min(1, "Tên là bắt buộc"),
    description: z.string(),
    dueDate: z.date().optional(),
    applyTo: z.array(z.string()).min(1, "Phải chọn ít nhất một người"),
    payTo: z.string().optional(),
    splitMethod: z.enum(Object.values(InvoiceSplitMethod)),
    // splitMap: z.looseObject<Record<string, number>>({}).refine(
    //     (val) => {
    //         const num = z.coerce.number();
    //         return Object.values(val).every(
    //             (v) => num.parse(v) >= 0
    //         );
    //     },
    //     {
    //         message:
    //             "Số tiền/Phần trăm trong cấu hình chia tiền phải là số dương",
    //     }
    // ),
    splitMap: z.record(
        z.string(),
        z.coerce.number<number>("Giá trị chia phải là một số").min(0)
    ),
    advancePayer: payInfoSchema.optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

const getInvoiceNamesByType = (type: string, monthYear: string) => {
    const [year, month] = monthYear.split("-");
    if (type === "walec") {
        return `Tiền điện nước ${month}/${year}`;
    }
    if (type === "roomCost") {
        return `Tiền phòng ${month}/${year}`;
    }
    return "Tiền tháng " + month + "/" + year;
};

const SplitConfig = ({
    form,
    field,
}: {
    form: UseFormReturn<InvoiceFormValues>;
    field: ControllerRenderProps<InvoiceFormValues, "splitMap">;
}) => {
    const {
        roommatesQuery: { data: roommates },
    } = useRoommates();

    const { userData } = useAuth();
    const splitMethod = form.watch("splitMethod");

    const autoFill = () => {
        const total =
            form.getValues("splitMethod") === InvoiceSplitMethod.BY_FIXED_AMOUNT
                ? form.getValues("amount")
                : 100;
        let acc = form
            .getValues("applyTo")
            .reduce(
                (acc, key) =>
                    (Number.parseFloat(field.value[key] as unknown as string) || 0) +
                    (acc || 0),
                0
            );
        const remainning = total - acc;

        const countEmpty = form
            .getValues("applyTo")
            .filter((v) => !field.value[v]).length;

        const fieldValue = {
            ...field.value,
        };
        const splitted =
            remainning > 0
                ? splitMethod === InvoiceSplitMethod.BY_PERCENTAGE
                    ? +(remainning / countEmpty).toFixed(2)
                    : Math.round(remainning / countEmpty)
                : 0;
        for (const key of form.getValues("applyTo")) {
            if (field.value[key]) continue;
            console.log(acc + splitted - total);
            if (Math.abs(acc + splitted - total) <= 1)
                fieldValue[key] = total - acc;
            else fieldValue[key] = splitted;

            acc += splitted;
        }
        field.onChange(fieldValue);
        console.log(total, remainning, countEmpty, field.value);
    };

    const total = sum(
        Object.values(field.value || []).map((v) =>
            Number.parseFloat((v as unknown as string) || "0")
        ) as number[]
    );

    const amount = form.watch("amount");

    return (
        <FormItem>
            <FormLabel>Cấu hình chia tiền</FormLabel>
            <FormDescription>
                {splitMethod === InvoiceSplitMethod.BY_FIXED_AMOUNT &&
                    `Nhập số tiền cho từng người (Đã nhập ${formatCurrency(
                        total
                    )}/${formatCurrency(amount)})`}
                {splitMethod === InvoiceSplitMethod.BY_PERCENTAGE &&
                    `Nhập phần trăm cho từng người (Đã nhập ${total}%/100%)`}
            </FormDescription>

            <FormControl>
                <div className="space-y-4 h-full">
                    <div className="space-x-2">
                        <Button onClick={autoFill} type="button">
                            Tự động điền
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => field.onChange({})}
                        >
                            Xóa
                        </Button>
                    </div>
                    {form.watch("applyTo").map((userId) => {
                        const roommate = roommates?.find(
                            (r) => r.userId === userId
                        );
                        if (!roommate) return null;
                        const onValueChange = (
                            e:
                                | string
                                | ChangeEvent<HTMLInputElement>
                                | undefined
                        ) => {
                            const value =
                                typeof e === "object" ? e.target.value : e;
                            field.onChange({
                                ...field.value,
                                [userId]: value,
                            });
                        };
                        return (
                            <div
                                key={userId}
                                className="flex flex-col gap-2 p-2 border rounded-md"
                            >
                                <RoommateItem
                                    roommate={roommate}
                                    myselfId={userData?._id}
                                />
                                <div className="flex gap-2">
                                    {splitMethod ===
                                        InvoiceSplitMethod.BY_FIXED_AMOUNT && (
                                        <CurrencyInput
                                            placeholder="Nhập số tiền"
                                            value={field.value?.[userId] ?? ""}
                                            min={0}
                                            allowNegativeValue={false}
                                            allowDecimals={false}
                                            onValueChange={onValueChange}
                                        />
                                    )}
                                    {splitMethod ===
                                        InvoiceSplitMethod.BY_PERCENTAGE && (
                                        <>
                                            <span className="inline-flex items-center">
                                                %
                                            </span>
                                            <Input
                                                type="number"
                                                placeholder="Phần trăm"
                                                onChange={onValueChange}
                                                max={100}
                                                value={
                                                    field.value?.[userId] ?? ""
                                                }
                                            />
                                        </>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            field.onChange({
                                                ...field.value,
                                                [userId]: undefined,
                                            })
                                        }
                                    >
                                        Xóa
                                    </Button>
                                </div>
                                {splitMethod ===
                                    InvoiceSplitMethod.BY_PERCENTAGE &&
                                    field.value?.[userId] && (
                                        <div className="text-xs text-muted-foreground">
                                            {`${formatCurrency(
                                                (field.value[userId]! / 100) *
                                                    (amount || 0)
                                            )}/${formatCurrency(amount)}`}
                                        </div>
                                    )}
                            </div>
                        );
                    })}
                </div>
            </FormControl>
            <FormMessage />
        </FormItem>
    );
};

export function InvoiceForm({
    onSuccess,
    invoice,
    type,
}: {
    onSuccess?: (invoice: IInvoice) => void;
    invoice?: IInvoice | null;
    type: CreateInvoiceFormData["type"];
}) {
    const { data: room } = useRoomQuery();
    const {
        roommatesQuery: { data: roommates },
    } = useRoommates();
    const { userData } = useAuth();

    const isEditMode = !!invoice;

    const [hasAdvancePayer, setHasAdvancePayer] = useState(false);
    const [isAdvancePayerPaysFullAmount, setIsAdvancePayerPaysFullAmount] =
        useState(true);

    if (!roommates) return <div>Loading...</div>;

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceFormSchema),
        defaultValues: {
            roomId: room._id,
            amount: 0,
            type: "other",
            name: "",
            monthApplied: undefined,
            description: "",
            dueDate: undefined,
            applyTo: roommates.map((r) => r.userId),
            advancePayer: undefined,
            payTo: "",
            splitMethod: InvoiceSplitMethod.BY_EQUALLY,
            splitMap: {},
        },
    });

    console.log(form.formState.errors);

    useEffect(() => {
        if (type !== "other") {
            form.reset({
                type: invoice?.type || type,
                roomId: invoice?.roomId || room._id,
                monthApplied: invoice?.monthApplied || toYYYYMM(new Date()),
                name:
                    invoice?.name ||
                    getInvoiceNamesByType(type, toYYYYMM(new Date())),
                amount: invoice?.amount || 0,
                description: invoice?.description || "",
                dueDate: invoice?.dueDate || undefined,
                applyTo: invoice?.applyTo || roommates.map((r) => r.userId),
                advancePayer: invoice?.advancePayer || undefined,
                payTo: invoice?.payTo || "",
                splitMethod:
                    invoice?.splitMethod || InvoiceSplitMethod.BY_PRESENCE,
                splitMap: invoice?.splitMap || {},
            } as InvoiceFormValues);
        } else {
            form.reset({
                type: invoice?.type || type,
                roomId: invoice?.roomId || room._id,
                amount: invoice?.amount || 0,
                name: invoice?.name || "",
                description: invoice?.description || "",
                dueDate: invoice?.dueDate || undefined,
                monthApplied: invoice?.monthApplied || undefined,
                applyTo: invoice?.applyTo || roommates.map((r) => r.userId),
                advancePayer: invoice?.advancePayer || undefined,
                payTo: invoice?.payTo || "",
                splitMethod:
                    invoice?.splitMethod || InvoiceSplitMethod.BY_EQUALLY,
                splitMap: invoice?.splitMap || {},
            } as InvoiceFormValues);
        }
    }, [invoice, type, room, roommates]);

    const currentFormType = form.watch("type");

    // useEffect(() => {
    //     if (hasAdvancePayer) {
    //         form.setValue("advancePayer", {
    //             paidBy: userData?._id || "",
    //             amount: isAdvancePayerPaysFullAmount ? form.getValues("amount") : 0,
    //             paidAt: new Date(),
    //         });
    //     } else {
    //         form.setValue("advancePayer", undefined);
    //     }
    // }, [hasAdvancePayer])

    // useEffect(() => {
    //     if (!hasAdvancePayer) return;

    //     if (isAdvancePayerPaysFullAmount) {
    //         form.setValue("advancePayer.amount", form.getValues("amount"));
    //     } else {
    //         form.setValue("advancePayer.amount", 0);
    //     }
    // }, [form.watch("amount"), isAdvancePayerPaysFullAmount, hasAdvancePayer])

    const { mutateAsync } = useMutation({
        mutationFn: async (values: CreateInvoiceFormData) => {
            console.log("Creating/updating invoice with values:", values);
            const updatedInvoice = isEditMode
                ? await handleAction(
                      updateInvoice({ invoiceId: invoice!._id, ...values })
                  )
                : await handleAction(createNewInvoice(values));
            queryClient.invalidateQueries({
                queryKey: invoicesQueryKey(room._id),
            });
            return updatedInvoice;
        },
        onSuccess: (data) => {
            form.reset();
            setHasAdvancePayer(false);
            setIsAdvancePayerPaysFullAmount(true);
            onSuccess?.(data);
        },
        onError: (error) => {
            console.error("Failed to create invoice:", error);
            toast.error("Đã có lỗi xảy ra khi tạo hóa đơn.", {
                description: error?.message,
            });
        },
    });

    async function onSubmit(values: InvoiceFormValues) {
        console.log(values);
        if (values.splitMethod === InvoiceSplitMethod.BY_FIXED_AMOUNT) {
            const total = sum(Object.values(values.splitMap || {}) as number[]);
            if (Math.abs(total - values.amount) > 1) {
                form.setError("splitMap", {
                    message: `Tổng số tiền trong cấu hình chia tiền (${total.toLocaleString(
                        "vi-VN"
                    )} VND) không khớp với tổng số tiền hóa đơn (${values.amount.toLocaleString(
                        "vi-VN"
                    )} VND). Vui lòng kiểm tra lại.`,
                });
                return;
            }
        }

        if (values.splitMethod === InvoiceSplitMethod.BY_PERCENTAGE) {
            const total = sum(Object.values(values.splitMap || {}) as number[]);
            if (Math.abs(total - 100) > 0.1) {
                form.setError("splitMap", {
                    message: `Tổng phần trăm trong cấu hình chia tiền (${total.toLocaleString(
                        "vi-VN"
                    )}%) không khớp với 100%. Vui lòng kiểm tra lại.`,
                });
                return;
            }
        }
        return await mutateAsync(values as CreateInvoiceFormData);
    }

    const splitMethod = form.watch("splitMethod");

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
                                <CurrencyInput
                                    className=""
                                    placeholder="Nhập số tiền"
                                    value={field.value}
                                    onValueChange={(
                                        value: string | undefined
                                    ) => field.onChange(value)}
                                />
                            </FormControl>
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
                                <Input
                                    placeholder="Tiền bình nước,..."
                                    {...field}
                                />
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
                                <Textarea
                                    placeholder="Viết mô tả chi tiết (không bắt buộc)"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Month Applied */}
                {currentFormType !== "other" && (
                    <FormField
                        control={form.control}
                        name="monthApplied"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tháng áp dụng*</FormLabel>
                                <FormControl>
                                    <div className="flex space-x-2">
                                        <Select
                                            onValueChange={(value) => {
                                                const [year, month] =
                                                    field.value!.split("-");
                                                field.onChange(
                                                    `${year}-${value}`
                                                );
                                            }}
                                            defaultValue={
                                                field.value!.split("-")[1]
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Tháng" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Array.from(
                                                    { length: 12 },
                                                    (_, i) => i + 1
                                                ).map((month) => (
                                                    <SelectItem
                                                        key={month}
                                                        value={month
                                                            .toString()
                                                            .padStart(2, "0")}
                                                    >
                                                        {month
                                                            .toString()
                                                            .padStart(2, "0")}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select
                                            onValueChange={(value) => {
                                                const [year, month] =
                                                    field.value!.split("-");
                                                field.onChange(
                                                    `${value}-${month}`
                                                );
                                            }}
                                            defaultValue={
                                                field.value!.split("-")[0]
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Năm" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Array.from(
                                                    { length: 5 },
                                                    (_, i) =>
                                                        new Date().getFullYear() -
                                                        i
                                                ).map((year) => (
                                                    <SelectItem
                                                        key={year}
                                                        value={year.toString()}
                                                    >
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {/* Apply To*/}

                <FormField
                    control={form.control}
                    name="applyTo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Áp dụng cho</FormLabel>
                            <FormControl>
                                <DropdownMenu>
                                    <FormControl>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline">
                                                {field.value?.length ===
                                                roommates.length
                                                    ? "Cả phòng"
                                                    : field.value
                                                          .slice(0, 2)
                                                          ?.map((r) => {
                                                              const user =
                                                                  roommates.find(
                                                                      (
                                                                          roommate
                                                                      ) =>
                                                                          roommate.userId ===
                                                                          r
                                                                  );

                                                              return (
                                                                  <>
                                                                      <UserAvatar
                                                                          key={
                                                                              r
                                                                          }
                                                                          user={
                                                                              user!
                                                                          }
                                                                          className="h-5 w-5"
                                                                      />
                                                                      <div className="text-xs max-w-10 sm:max-w-full truncate">
                                                                          {
                                                                              user?.displayName
                                                                          }
                                                                      </div>
                                                                  </>
                                                              );
                                                          })
                                                          .concat([
                                                              field.value
                                                                  .length >
                                                              2 ? (
                                                                  <Badge variant="secondary">
                                                                      +
                                                                      {field
                                                                          .value
                                                                          .length -
                                                                          2}
                                                                  </Badge>
                                                              ) : null,
                                                          ] as any[]) ||
                                                      "Chọn những người áp dụng"}
                                                <ChevronDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </FormControl>
                                    <DropdownMenuContent className="w-[320px]">
                                        <div className="flex items-center justify-between">
                                            <DropdownMenuLabel className="text-xs">
                                                Chọn những người áp dụng
                                            </DropdownMenuLabel>
                                            <div className="space-x-2 *:text-xs">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        field.onChange(
                                                            roommates.map(
                                                                (r) => r.userId
                                                            )
                                                        )
                                                    }
                                                >
                                                    Chọn tất cả
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        field.onChange([])
                                                    }
                                                >
                                                    Xóa
                                                </Button>
                                            </div>
                                        </div>
                                        <DropdownMenuSeparator />
                                        {roommates.map((r) => (
                                            <DropdownMenuCheckboxItem
                                                key={r.userId}
                                                checked={field.value?.includes(
                                                    r.userId
                                                )}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        field.onChange([
                                                            ...(field.value ||
                                                                []),
                                                            r.userId,
                                                        ]);
                                                    } else {
                                                        field.onChange(
                                                            field.value?.filter(
                                                                (v) =>
                                                                    v !==
                                                                    r.userId
                                                            )
                                                        );
                                                    }
                                                }}
                                                onSelect={(e) =>
                                                    e.preventDefault()
                                                }
                                            >
                                                <RoommateItem
                                                    roommate={r}
                                                    myselfId={userData?._id}
                                                />
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </FormControl>
                            <FormDescription>
                                Đã chọn {field.value?.length || 0} người chia
                                hóa đơn
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-between items-center">
                    <FormField
                        control={form.control}
                        name="payTo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Thanh toán cho</FormLabel>
                                <FormControl>
                                    <Select
                                        /** Set key to fix onValueChange bug */
                                        key={
                                            field.value
                                                ? `status-${field.value}`
                                                : "status-initial"
                                        }
                                        disabled={hasAdvancePayer}
                                        value={field.value}
                                        onValueChange={(value) => {
                                            console.log(
                                                "Selected payTo value:",
                                                value
                                            );
                                            // if (value === "bank_account") {
                                            //     return;
                                            // }
                                            // if (value === "qr_code") {
                                            //     return;
                                            // }
                                            field.onChange(value);
                                        }}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn một" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {roommates.map((r) => (
                                                <SelectItem
                                                    key={r.userId}
                                                    value={r.userId}
                                                >
                                                    <RoommateItem
                                                        roommate={r}
                                                        myselfId={userData?._id}
                                                    />
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

                    <FormField
                        control={form.control}
                        name="splitMethod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cách chia tiền</FormLabel>
                                <FormControl>
                                    <Select
                                        key={
                                            field.value
                                                ? `status-${field.value}`
                                                : "status-initial"
                                        }
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn cách chia" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem
                                                value={
                                                    InvoiceSplitMethod.BY_EQUALLY
                                                }
                                            >
                                                Chia đều
                                            </SelectItem>
                                            <SelectItem
                                                value={
                                                    InvoiceSplitMethod.BY_FIXED_AMOUNT
                                                }
                                            >
                                                Chia theo số tiền
                                            </SelectItem>
                                            <SelectItem
                                                value={
                                                    InvoiceSplitMethod.BY_PERCENTAGE
                                                }
                                            >
                                                Chia theo phần trăm
                                            </SelectItem>
                                            {type !== "other" && (
                                                <SelectItem
                                                    value={
                                                        InvoiceSplitMethod.BY_PRESENCE
                                                    }
                                                >
                                                    Chia theo ngày ở
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                {splitMethod !== InvoiceSplitMethod.BY_EQUALLY &&
                    splitMethod !== InvoiceSplitMethod.BY_PRESENCE && (
                        <FormField
                            control={form.control}
                            name="splitMap"
                            render={({ field }) => (
                                <SplitConfig form={form} field={field} />
                            )}
                        />
                    )}

                {/* <div className="flex items-center justify-between"> */}
                {/* Due Date */}
                {/* <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Ngày hết hạn?</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className="justify-start text-left font-normal"
                                            >
                                                {field.value ? (
                                                    formatDate(field.value)
                                                ) : (
                                                    <span>
                                                        Chọn ngày (không bắt
                                                        buộc)
                                                    </span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        align="start"
                                        className="p-0"
                                    >
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
                    /> */}
                {/* </div> */}
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
                <Button disabled={form.formState.isSubmitting} type="submit">
                    {isEditMode ? "Sửa" : "Thêm"} hóa đơn
                </Button>
            </form>
        </Form>
    );
}
