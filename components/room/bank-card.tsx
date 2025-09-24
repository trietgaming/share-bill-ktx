import { useBanks } from "@/hooks/use-banks";
import { IClientBankAccount } from "@/types/bank-account";

export function BankCard({ account }: { account: IClientBankAccount }) {
    return account.qrCodeUrl ? (
        <PayQRCodeCard account={account} />
    ) : (
        <BankAccountCard account={account} />
    );
}

export function PayQRCodeCard({ account }: { account: IClientBankAccount }) {
    return (
        <div className="border rounded-lg flex flex-col items-center">
            <h3 className="text-center mb-2 mt-4">{account.bankName}</h3>
            <img
                src={account.qrCodeUrl}
                alt="QR Code"
                className="w-32 h-32 object-contain mb-4"
            />
        </div>
    );
}

export function BankAccountCard({ account }: { account: IClientBankAccount }) {
    const { getBankLogoByShortName } = useBanks();

    return (
        <div className="flex flex-col items-center gap-4 border rounded-lg p-4">
            <div className="*:text-center">
                <img
                    alt="Bank logo"
                    className="h-8 object-cover mx-auto"
                    src={getBankLogoByShortName(account.bankName)}
                />
                <h3 className="font-medium">{account.bankName}</h3>
                <p className="text-sm md:text-base text-foreground font-mono break-all">
                    {account.accountNumber}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                    {account.accountName}
                </p>
            </div>
            <img
                src={`https://img.vietqr.io/image/${account.bankName}-${account.accountNumber}-qr_only.jpg}`}
                alt="Mã QR thanh toán"
                className="w-24 h-24 object-contain border rounded-lg bg-white"
            />
        </div>
    );
}
