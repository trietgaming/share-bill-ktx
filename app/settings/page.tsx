"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Save, User } from "lucide-react"
import { ProfilePhotoUpload } from "@/components/settings/profile-photo-upload"
import { BankAccountCard } from "@/components/settings/bank-account-card"
import { BankAccountDialog } from "@/components/settings/bank-account-dialog"
import { toast } from "sonner"
import { updateUserData } from "@/lib/actions/user-data"
import { useAuth } from "@/components/auth-context"
import { BankAccountList } from "@/components/settings/bank-account-list"

const profileSchema = z.object({
    displayName: z.string().min(1, "Tên hiển thị không được để trống"),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function UserManagementPage() {
    const { userData, setUserData } = useAuth();

    if (!userData) {
        return <div>Loading...</div>
    }

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            displayName: userData.displayName,
        },
    })

    const handleProfileSubmit = async (data: ProfileFormData) => {
        try {
            await updateUserData(data)
            setUserData(prev => ({ ...prev, displayName: data.displayName }) as typeof prev);
            form.reset(data);
            toast.success("Thành công", {
                description: "Thông tin cá nhân đã được cập nhật",
            })
        } catch (error) {
            toast.error("Lỗi", {
                description: "Đã có lỗi xảy ra khi cập nhật thông tin cá nhân",
            })
        }
    }



    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto py-8 px-4 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-balance mb-2">Quản lý thông tin cá nhân</h1>
                    <p className="text-muted-foreground">Cập nhật thông tin cá nhân và quản lý tài khoản ngân hàng của bạn</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* userData Photo Section */}
                    <Card className="lg:col-span-1">
                        <CardHeader className="text-center">
                            <CardTitle className="flex items-center justify-center gap-2">
                                <User className="w-5 h-5" />
                                Ảnh đại diện
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProfilePhotoUpload
                                className="w-full"
                            />
                        </CardContent>
                    </Card>

                    {/* userData Information Section */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Thông tin cá nhân</CardTitle>
                            <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Tên hiển thị</Label>
                                    <Input id="displayName" {...form.register("displayName")} placeholder="Nhập tên hiển thị" />
                                    {form.formState.errors.displayName && (
                                        <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" value={userData.email} disabled className="bg-muted" />
                                    <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
                                </div>

                                <Button disabled={form.formState.isSubmitting || !form.formState.isDirty} type="submit" className="w-full">
                                    <Save className="w-4 h-4 mr-2" />
                                    Lưu thay đổi
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <BankAccountList />

            </div>
        </div>
    )
}
