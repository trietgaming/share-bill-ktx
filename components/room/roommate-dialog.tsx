"use client";

import type React from "react";

import { format } from "date-fns";
import { Calendar, CreditCard, Mail, Shield, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Roommate } from "@/types/roommate";
import { RoleBadge } from "../role-badge";
import { UserAvatar } from "../user-avatar";
import { RoommateBankTabs } from "./roommate-bank-tabs";
import { formatDate } from "@/lib/utils";

interface RoommateInfoDialogProps {
    roommate: Roommate | null;
    children?: React.ReactNode;
}

export function RoommateInfoDialog({
    roommate,
    children,
    ...props
}: React.ComponentProps<typeof Dialog> & RoommateInfoDialogProps) {

    if (!roommate) return <>{children}</>;

    return (
        <Dialog open={!!roommate} {...props}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-md max-h-screen overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-center">
                        Thông tin thành viên
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Avatar and Basic Info */}
                    <div className="flex flex-col items-center space-y-3">
                        <UserAvatar user={roommate} />

                        <div className="text-center space-y-1">
                            <h3 className="font-semibold text-lg">
                                {roommate.displayName}
                            </h3>
                            <RoleBadge role={roommate.role} />
                        </div>
                    </div>

                    <Separator />

                    {/* Contact Information */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                            Thông tin liên hệ
                        </h4>

                        <div className="flex items-center gap-3">
                            <Mail className="size-4 text-muted-foreground" />
                            <span className="text-sm">{roommate.email}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Calendar className="size-4 text-muted-foreground" />
                            <span className="text-sm">
                                Tham gia vào: {formatDate(roommate.joinedAt)}
                            </span>
                        </div>
                    </div>

                    {/* Bank Accounts */}
                    {roommate.bankAccounts.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                    Tài khoản ngân hàng
                                </h4>

                                <RoommateBankTabs
                                    bankAccounts={roommate.bankAccounts}
                                />
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
