"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth-context";
import { logOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { LOGIN_PATH } from "@/lib/app-constants";

export function UserMenu() {
    const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
    const { userData } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logOut();
        router.replace(LOGIN_PATH);
    };

    if (!userData) return null;

    return (
        <DropdownMenu open={showUserMenu} onOpenChange={setShowUserMenu}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={userData.photoURL || void 0} />
                        <AvatarFallback>
                            {userData.displayName.slice(0, 2) || "User"}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleLogout}
                >
                    Đăng xuất
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
