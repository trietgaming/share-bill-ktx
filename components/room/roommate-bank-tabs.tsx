import { IClientBankAccount } from "@/types/bank-account";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BankCard } from "./bank-card";

export function RoommateBankTabs({
    bankAccounts,
}: {
    bankAccounts: IClientBankAccount[];
}) {
    return bankAccounts.length ? (
        <Tabs defaultValue={bankAccounts[0]?._id}>
            {bankAccounts.length! > 1 && (
                <TabsList>
                    {bankAccounts.map((account, index) => (
                        <TabsTrigger key={account._id} value={account._id}>
                            {account.bankName}
                        </TabsTrigger>
                    ))}
                </TabsList>
            )}
            {bankAccounts.map((account) => (
                <TabsContent
                    key={account._id}
                    value={account._id}
                    className="mt-2"
                >
                    <BankCard account={account} />
                </TabsContent>
            ))}
        </Tabs>
    ) : (
        <span className="text-sm text-muted-foreground">
            Chưa có tài khoản ngân hàng
        </span>
    );
}
