"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, CreditCard, QrCode } from "lucide-react"
import type { IClientBankAccount } from "@/types/BankAccount"
import Image from "next/image"
import { useConfirm } from "../are-you-sure"
import { useMutation } from "@tanstack/react-query"
import { deleteUserBankAccount } from "@/lib/actions/user-data"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
import { IUserDataWithBankAccounts } from "@/types/UserData"

interface BankAccountCardProps {
  account: IClientBankAccount
  onEdit: (account: IClientBankAccount) => void
}

export function BankAccountCard({ account, onEdit }: BankAccountCardProps) {
  const { setUserData } = useAuth();
  const isQrAccount = !!account.qrCodeUrl

  const { mutate: handleDeleteAccount } = useMutation({
    mutationFn: () => deleteUserBankAccount(account._id),
    onError: () => {
      toast.error("Lỗi", {
        description: "Đã có lỗi xảy ra khi xoá tài khoản ngân hàng"
      })
    },
    onSuccess: () => {
      setUserData((prev) => ({
        ...prev,
        bankAccounts: prev!.bankAccounts.filter(b => b._id !== account._id)
      }) as IUserDataWithBankAccounts);

      toast.success("Thành công", {
        description: "Tài khoản ngân hàng đã được xoá"
      });
    }
  })

  const confirmDelete = useConfirm(handleDeleteAccount, {
    title: "Xoá tài khoản ngân hàng",
    description: "Bạn có chắc chắn muốn xoá tài khoản ngân hàng này không? Hành động này không thể hoàn tác.",
    confirmText: "Xoá",
    variant: "destructive",
  })

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="p-2 bg-secondary rounded-lg flex-shrink-0">
              {isQrAccount ? (
                <QrCode className="w-5 h-5 text-primary" />
              ) : (
                <CreditCard className="w-5 h-5 text-primary" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {isQrAccount ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-sm">Mã QR thanh toán</h3>
                    <Badge variant="secondary" className="text-xs">
                      QR
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <img
                      src={account.qrCodeUrl || "/placeholder.svg"}
                      alt="Mã QR thanh toán"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain border rounded-lg bg-white"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        target.nextElementSibling?.classList.remove("hidden")
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1 hidden">Không thể tải ảnh QR</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xs font-medium truncate">{account.bankName}</h3>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      Ngân hàng
                    </Badge>
                  </div>
                  <p className="text-sm md:text-base text-foreground font-mono break-all">{account.accountNumber}</p>
                  <p className="text-sm text-muted-foreground truncate">{account.accountName}</p>
                  <img
                    src={`https://img.vietqr.io/image/${account.bankName}-${account.accountNumber}-qr_only.jpg}`}
                    alt="Mã QR thanh toán"
                    className="w-20 h-20 object-contain border rounded-lg bg-white"

                  />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 flex-shrink-0 self-start sm:ml-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(account)} className="h-8 w-8 p-0">
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => confirmDelete()}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
