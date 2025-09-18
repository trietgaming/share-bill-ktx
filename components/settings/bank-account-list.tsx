"use client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BankAccountCard } from "./bank-account-card";
import { BankAccountDialog } from "./bank-account-dialog";
import { useState } from "react";
import { useAuth } from "@/components/auth-context";
import { IClientBankAccount } from "@/types/bank-account";
import { MAX_BANK_ACCOUNTS_PER_USER } from "@/lib/app-constants";

export function BankAccountList() {
    const { userData } = useAuth();
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingAccount, setEditingAccount] = useState<IClientBankAccount | undefined>()

    const handleAddAccount = () => {
        setEditingAccount(undefined)
        setDialogOpen(true)
    }

    const handleEditAccount = (account: IClientBankAccount) => {
        setEditingAccount(account)
        setDialogOpen(true)
    }

    return (
        <>
            <Card className="mt-6">
                <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <CardTitle>Tài khoản ngân hàng</CardTitle>
                            <CardDescription>Quản lý danh sách tài khoản ngân hàng và mã QR thanh toán</CardDescription>
                        </div>
                        <Button hidden={userData!.bankAccounts.length >= MAX_BANK_ACCOUNTS_PER_USER} onClick={handleAddAccount}>
                            <Plus className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline-block">Thêm tài khoản</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {userData!.bankAccounts.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">Chưa có tài khoản ngân hàng nào</p>
                            <Button onClick={handleAddAccount} variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Thêm tài khoản đầu tiên
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {userData!.bankAccounts.map((account) => (
                                <BankAccountCard
                                    key={account._id}
                                    account={account}
                                    onEdit={handleEditAccount}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bank Account Dialog */}
            <BankAccountDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                account={editingAccount}
            />
        </>
    )
}