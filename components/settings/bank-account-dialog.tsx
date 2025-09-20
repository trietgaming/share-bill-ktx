"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import type { IClientBankAccount } from "@/types/bank-account";
import { createOrUpdateUserBankAccount } from "@/lib/actions/user-data";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";
import { BankSelect } from "./bank-select";
import { handleAction } from "@/lib/action-handler";

const bankAccountSchema = z
    .object({
        id: z.string().optional(),
        accountNumber: z.string().optional(),
        accountName: z.string().optional(),
        bankName: z.string().min(1, "Tên ngân hàng hoặc mã QR là bắt buộc"),
        qrCodeUrl: z.string().optional(),
    })
    .refine(
        (data) => {
            // Either all bank details are provided OR qrCodeUrl is provided
            const hasBankDetails =
                data.accountNumber && data.accountName && data.bankName;
            const hasQrCode =
                data.bankName && data.qrCodeUrl && data.qrCodeUrl.length > 0;
            return hasBankDetails || hasQrCode;
        },
        {
            message:
                "Vui lòng nhập đầy đủ thông tin ngân hàng hoặc tải lên mã QR",
            path: ["accountNumber"],
        }
    );

type BankAccountFormData = z.infer<typeof bankAccountSchema>;

interface BankAccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    account?: IClientBankAccount;
}

export function BankAccountDialog({
    open,
    onOpenChange,
    account,
}: BankAccountDialogProps) {
    const { setUserData } = useAuth();
    const [isQrMode, setIsQrMode] = useState(false);
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [qrPreview, setQrPreview] = useState<string>("");

    const form = useForm<BankAccountFormData>({
        resolver: zodResolver(bankAccountSchema),
        defaultValues: {
            id: undefined,
            accountNumber: "",
            accountName: "",
            bankName: "",
            qrCodeUrl: "",
        },
    });

    const resetForm = () => {
        form.reset({
            id: undefined,
            accountNumber: "",
            accountName: "",
            bankName: "",
            qrCodeUrl: "",
        });
        setIsQrMode(false);
        setQrFile(null);
        setQrPreview("");
    };

    useEffect(() => {
        if (account) {
            form.reset({
                id: account._id,
                accountNumber: account.accountNumber || "",
                accountName: account.accountName || "",
                bankName: account.bankName || "",
                qrCodeUrl: account.qrCodeUrl || "",
            });
            setIsQrMode(!!account.qrCodeUrl);
            if (account.qrCodeUrl) {
                setQrPreview(account.qrCodeUrl);
            }
        } else {
            resetForm();
        }
    }, [account, form]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setQrFile(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setQrPreview(result);
                form.setValue("qrCodeUrl", result, { shouldDirty: true });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeQrFile = () => {
        setQrFile(null);
        setQrPreview("");
        form.setValue("qrCodeUrl", "");
    };

    const onSubmit = async (data: BankAccountFormData) => {
        try {
            console.log(data);
            const updatedBankAccount = await handleAction(
                createOrUpdateUserBankAccount(
                    isQrMode
                        ? {
                              id: account?._id,
                              qrCodeFile: qrFile!,
                              bankName: data.bankName,
                          }
                        : data
                )
            );
            setUserData((prev) => {
                if (!prev) return prev;
                let found = false;
                const updatedAccounts = prev.bankAccounts.map((acc) => {
                    if (acc._id === updatedBankAccount._id) {
                        found = true;
                        return updatedBankAccount;
                    }
                    return acc;
                });
                if (!found) {
                    updatedAccounts.push(updatedBankAccount);
                }
                return { ...prev, bankAccounts: updatedAccounts };
            });

            toast.success(
                `Tài khoản ngân hàng đã được ${account ? "cập nhật" : "thêm"}`
            );

            onOpenChange(false);
            resetForm();
        } catch (error: any) {
            toast.error(
                `Đã có lỗi xảy ra khi ${
                    account ? "cập nhật" : "thêm"
                } tài khoản ngân hàng`,
                {
                    description: error?.message,
                }
            );

            throw error;
        }
    };

    const toggleMode = () => {
        setIsQrMode(!isQrMode);
        form.clearErrors();
        if (isQrMode) {
            setQrFile(null);
            setQrPreview("");
            form.setValue("qrCodeUrl", "");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {account
                            ? "Chỉnh sửa tài khoản ngân hàng"
                            : "Thêm tài khoản ngân hàng"}
                    </DialogTitle>
                    <DialogDescription>
                        Nhập thông tin tài khoản ngân hàng hoặc tải lên mã QR
                        thanh toán.
                    </DialogDescription>
                </DialogHeader>

                {!account && (
                    <div className="flex items-center gap-2 mb-4">
                        <Button
                            type="button"
                            variant={!isQrMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => !isQrMode || toggleMode()}
                        >
                            Thông tin ngân hàng
                        </Button>
                        <Button
                            type="button"
                            variant={isQrMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => isQrMode || toggleMode()}
                        >
                            Mã QR
                        </Button>
                    </div>
                )}

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        {!isQrMode ? (
                            <>
                                <FormField
                                    control={form.control}
                                    name="accountNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Số tài khoản *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Nhập số tài khoản"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="accountName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Tên chủ tài khoản *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Nhập tên chủ tài khoản"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bankName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Tên ngân hàng *
                                            </FormLabel>
                                            <FormControl>
                                                <BankSelect
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        ) : (
                            <>
                                <FormField
                                    control={form.control}
                                    name="bankName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tên mã QR*</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="MOMO, ZaloPay..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="qrCodeUrl"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>
                                                Mã QR thanh toán *
                                            </FormLabel>
                                            <FormControl>
                                                <div className="space-y-4">
                                                    {!qrPreview ? (
                                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={
                                                                    handleFileUpload
                                                                }
                                                                className="hidden"
                                                                id="qr-upload"
                                                            />
                                                            <label
                                                                htmlFor="qr-upload"
                                                                className="cursor-pointer"
                                                            >
                                                                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                                                <p className="text-sm text-gray-600 mb-2">
                                                                    Nhấp để tải
                                                                    lên ảnh mã
                                                                    QR
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    PNG, JPG,
                                                                    GIF tối đa
                                                                    10MB
                                                                </p>
                                                            </label>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <div className="border rounded-lg p-4 bg-gray-50">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="relative w-20 h-20 bg-white rounded border">
                                                                        <img
                                                                            src={
                                                                                qrPreview ||
                                                                                "/placeholder.svg"
                                                                            }
                                                                            alt="QR Code Preview"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 w-full">
                                                                        <p className="truncate max-w-[150px] text-sm font-medium text-gray-900">
                                                                            {qrFile?.name ||
                                                                                "Mã QR đã tải lên"}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            {qrFile
                                                                                ? `${(
                                                                                      qrFile.size /
                                                                                      1024
                                                                                  ).toFixed(
                                                                                      1
                                                                                  )} KB`
                                                                                : "Ảnh mã QR"}
                                                                        </p>
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={
                                                                            removeQrFile
                                                                        }
                                                                        className="text-red-500 hover:text-red-700"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                disabled={
                                    !form.formState.isDirty ||
                                    form.formState.isSubmitting
                                }
                                type="submit"
                            >
                                {account ? "Cập nhật" : "Thêm"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
