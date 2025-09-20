"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Receipt, Calendar, Users, ChevronDown } from "lucide-react";
import JoinRoomDialog from "@/components/join-room/join-room-dialog";
import CreateFormDialog from "@/components/create-room/create-room-dialog";
import { useState } from "react";

export function SubNavbar() {
    const [isJoinRoomDialogOpen, setIsJoinRoomDialogOpen] = useState(false);
    const [isCreateFormDialogOpen, setIsCreateFormDialogOpen] = useState(false);

    return (
        <div className="border-b border-border bg-card">
            <div className="flex h-14 items-center gap-4 px-6">
                {/* Add Room Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="gap-2 bg-transparent"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden md:inline-block">
                                Thêm phòng
                            </span>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                            <Button
                                onClick={() => setIsCreateFormDialogOpen(true)}
                                variant="ghost"
                                className="w-full justify-start"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                <span>Tạo phòng mới</span>
                            </Button>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Button
                                onClick={() => setIsJoinRoomDialogOpen(true)}
                                variant="ghost"
                                className="w-full justify-start"
                            >
                                <Users className="mr-2 h-4 w-4" />
                                <span>Gia nhập phòng</span>
                            </Button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* View Invoices Button
        <Button variant="outline" className="gap-2 bg-transparent">
          <Receipt className="h-4 w-4" />
          <span className="hidden md:inline-block">Xem hóa đơn</span>
        </Button>

        Fill Check-in Date Button
        <Button variant="outline" className="gap-2 bg-transparent">
          <Calendar className="h-4 w-4" />
          <span className="hidden md:inline-block">Điền ngày ở</span>
        </Button> */}
            </div>
            <JoinRoomDialog
                isOpen={isJoinRoomDialogOpen}
                onOpenChange={setIsJoinRoomDialogOpen}
            />
            <CreateFormDialog
                isOpen={isCreateFormDialogOpen}
                onOpenChange={setIsCreateFormDialogOpen}
            />
        </div>
    );
}
