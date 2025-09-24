"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    UserPlus,
    Settings,
    Shield,
    Users,
    DollarSign,
    Bell,
    Download,
    Upload,
    BarChart3,
    X,
    TriangleAlert,
    UserRoundCog,
    Key,
} from "lucide-react";
import { useConfirm } from "@/components/are-you-sure";
import {
    useRoomQuery,
    useInvoices,
    useRoommates,
} from "./contexts/room-context";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteRoom, leaveRoom } from "@/lib/actions/room";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { InviteMemberTab } from "./action-tabs/invite-member";
import { handleAction } from "@/lib/action-handler";
import { ManageMembersTab } from "./action-tabs/mange-members";
import { ManagePermissionsTab } from "./action-tabs/manage-permissions";
import { MemberRole } from "@/enums/member-role";
import { RoomDataForm } from "./room-data-form";
import { AddInvoiceButton } from "./add-invoice-button";
import { isRolePrecedentOrEqual } from "@/lib/permission";

interface RoomSidebarProps {
    onClose?: () => void;
    isSidebarOpen?: boolean;
}

function SidebarTabContent({
    children,
    onClose,
    ...props
}: React.ComponentProps<typeof TabsContent> & {
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <TabsContent className="w-full sm:w-80 h-screen bg-accent" {...props}>
            <Button
                className="absolute top-4 right-4"
                variant="ghost"
                size="icon"
                onClick={onClose}
            >
                <X className="h-5 w-5" />
            </Button>
            {children}
        </TabsContent>
    );
}

function SidebarTabTrigger({
    children,
    ...props
}: React.ComponentProps<typeof TabsTrigger> & { children: React.ReactNode }) {
    return (
        <TabsTrigger
            className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full justify-start bg-transparent text-sm border-visible"
            )}
            {...props}
        >
            {children}
        </TabsTrigger>
    );
}

export function RoomSidebar({ onClose, isSidebarOpen }: RoomSidebarProps) {
    const { data: room } = useRoomQuery();
    const { setAddInvoiceType } = useInvoices();
    const { membership } = useRoommates();

    const router = useRouter();

    const {
        mutate: handleDeleteRoom,
        isPending: isDeletingRoom,
        isSuccess: isDeleteRoomSuccess,
    } = useMutation({
        mutationFn: async () => {
            await handleAction(deleteRoom(room._id));
            router.push("/");
        },
        onError: (error) => {
            console.error("Error deleting room:", error);
            toast.error("Đã có lỗi xảy ra khi xóa phòng.");
        },
    });

    const {
        mutate: handleLeaveRoom,
        isPending: isLeavingRoom,
        isSuccess: isLeaveRoomSuccess,
    } = useMutation({
        mutationFn: async () => {
            await handleAction(leaveRoom(room._id));
            router.push("/");
        },
        onError: (error) => {
            console.error("Error leaving room:", error);
            toast.error("Đã có lỗi xảy ra khi rời phòng.", {
                description: error?.message,
            });
        },
    });

    const confirmDeleteRoom = useConfirm(handleDeleteRoom, {
        title: "Bạn có chắc chắn muốn xóa phòng này?",
        description:
            "Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến phòng sẽ bị xóa vĩnh viễn.",
        variant: "destructive",
        confirmText: "Xóa",
    });

    const confirmLeaveRoom = useConfirm(handleLeaveRoom, {
        title: "Bạn có chắc chắn muốn rời phòng này?",
        // Handle admin leaving the room text
        description:
            "Bạn có thể tham gia lại phòng nếu có lời mời hoặc mã phòng, hoặc khi được cho phép.",
        confirmText: "Rời phòng",
    });

    const [currentTab, setCurrentTab] = useState("default");

    const handleClose = () => {
        setCurrentTab("default");
    };

    return (
        <Tabs
            value={currentTab}
            onValueChange={setCurrentTab}
            orientation="vertical"
            className={`
  fixed xl:sticky top-0 left-0 z-50 w-screen sm:w-80 h-full
  bg-sidebar flex flex-col
  transform transition-transform duration-300 ease-in-out
  ${isSidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}
    `}
        >
            <TabsContent asChild value="default">
                <TabsList>
                    <div className="relative xl:static overflow-y-auto h-full">
                        <div className="xl:hidden flex items-center justify-between p-4 border-b border-border">
                            <h2 className="text-lg font-semibold">Menu</h2>
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                            {/* Quick Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                                        <Users className="h-4 lg:h-5 w-4 lg:w-5" />
                                        Hành động nhanh
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 lg:space-y-3">
                                    <SidebarTabTrigger value="invite-member">
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Mời thành viên
                                    </SidebarTabTrigger>
                                    <AddInvoiceButton
                                        className="w-full justify-start bg-transparent text-sm gap-4"
                                        variant="outline"
                                    />
                                </CardContent>
                            </Card>

                            {/* Room Settings */}
                            {isRolePrecedentOrEqual(
                                membership?.role,
                                MemberRole.MODERATOR
                            ) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                                            <Settings className="h-4 lg:h-5 w-4 lg:w-5" />
                                            Cài đặt phòng
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <RoomDataForm />
                                    </CardContent>
                                </Card>
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                                        <TriangleAlert className="h-4 lg:h-5 w-4 lg:w-5" />
                                        Nguy hiểm
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 lg:space-y-3">
                                    <Button
                                        disabled={
                                            isLeavingRoom || isLeaveRoomSuccess
                                        }
                                        onClick={() => confirmLeaveRoom()}
                                        variant="destructive"
                                        className="w-full justify-start text-sm"
                                    >
                                        Rời phòng
                                    </Button>
                                </CardContent>
                            </Card>

                            {(membership?.role == MemberRole.ADMIN ||
                                membership?.role == MemberRole.MODERATOR) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                                            <Key className="h-4 lg:h-5 w-4 lg:w-5" />
                                            Quản lý
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 lg:space-y-3">
                                        <SidebarTabTrigger value="manage-members">
                                            <UserRoundCog className="h-4 w-4 mr-2" />
                                            Quản lý thành viên
                                        </SidebarTabTrigger>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Admin Settings */}
                            {membership?.role === "admin" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                                            <Shield className="h-4 lg:h-5 w-4 lg:w-5" />
                                            Quản trị viên
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 lg:space-y-3">
                                        <SidebarTabTrigger value="manage-permissions">
                                            <Shield className="h-4 w-4 mr-2" />
                                            Quản lý Quyền
                                        </SidebarTabTrigger>
                                        {/* <Button variant="outline" className="w-full justify-start bg-transparent text-sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Cài đặt hệ thống
                    </Button> */}
                                        <Separator />
                                        <Button
                                            disabled={
                                                isDeletingRoom ||
                                                isDeleteRoomSuccess
                                            }
                                            onClick={() => confirmDeleteRoom()}
                                            variant="destructive"
                                            className="w-full justify-start text-sm"
                                        >
                                            Xóa phòng
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsList>
            </TabsContent>
            <SidebarTabContent value="invite-member" onClose={handleClose}>
                <InviteMemberTab />
            </SidebarTabContent>
            <SidebarTabContent value="manage-members" onClose={handleClose}>
                <ManageMembersTab />
            </SidebarTabContent>
            <SidebarTabContent value="manage-permissions" onClose={handleClose}>
                <ManagePermissionsTab />
            </SidebarTabContent>
        </Tabs>
    );
}
