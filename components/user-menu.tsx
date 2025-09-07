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

export function UserMenu() {
    const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
    const { user } = useAuth();

    const handleLogout = async () => {
        await logOut();
        window.location.reload();
    };

    return (
        <DropdownMenu open={showUserMenu} onOpenChange={setShowUserMenu}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.photoURL || void 0} />
                        <AvatarFallback>
                            {user?.displayName?.slice(0, 2) || "User"}
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
