"use client";

import type React from "react";

import { useState } from "react";
import { Hotel, Menu, Users, X } from "lucide-react";
import { RoomNavbar } from "@/components/room/room-navbar";
import { RoomSidebar } from "@/components/room/room-sidebar";
import { HomeDashboard } from "@/components/room/dashboard";
import { InvoicesManagement } from "@/components/room/invoices";
import { PresenceCalendar } from "@/components/room/presence";
import { HistoryLog } from "@/components/room/history";
import { Button } from "@/components/ui/button";
import { useRoomQuery } from "@/components/room/contexts/room-context";
import { Badge } from "@/components/ui/badge";
import { usePathname, useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { RoommateList } from "../roomate-list";

interface RoomLayoutProps {
    children?: React.ReactNode;
}

export function RoomLayout({ children }: RoomLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const { data: room } = useRoomQuery();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="flex h-16 items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-4">
                        {/* Mobile menu button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="xl:hidden"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                                <Hotel className="inline-block" /> {room.name}
                            </h1>
                            <span className="text-sm text-muted-foreground hidden sm:inline-block">
                                ID: {room._id}
                            </span>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                className="text-sm flex items-center gap-2 cursor-pointer"
                            >
                                <Users className="inline-block" />{" "}
                                {room.members.length}/{room.maxMembers}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="p-4 min-w-[300px] space-y-4">
                            <h3 className="text-center">Danh sách thành viên</h3>
                            <RoommateList />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Navigation */}
            <RoomNavbar />

            {/* Main Content */}
            <div className="flex relative">
                <RoomSidebar
                    isSidebarOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <main className="flex-1 p-4 md:p-6">{children}</main>

                {/* Mobile overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </div>
        </div>
    );
}
