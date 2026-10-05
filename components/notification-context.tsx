"use client";
import { firebaseMessaging } from "@/lib/firebase/client";
import { initializeNotification } from "@/lib/notification/notification";
import { onMessage } from "firebase/messaging";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import Dexie from "dexie";
import type { MessagePayload } from "firebase/messaging";
import {
    InfiniteData,
    useInfiniteQuery,
    UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { createNotification } from "@/lib/notification/notification-factory";
import { NotificationRecord, NotificationCursor } from "@/types/notification";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { useAuth } from "./auth-context";
import { notificationDb, storeNotification, getNotificationPage } from "@/lib/notification/notification-db";
import { handleForegroundMessage } from "@/lib/notification/foreground-message-dispatcher";
import { presenceQueryKey, queryClient } from "@/lib/query-client";
import { NotificationType } from "@/enums/notification";
import { useRouter } from "next/navigation";

export interface NotificationContextType {
    isNotificationPermissionGranted: boolean | null;
    notifications: NotificationRecord[];
    notificationQuery: UseInfiniteQueryResult<
        InfiniteData<
            {
                items: NotificationRecord[];
                nextCursor: NotificationCursor | null;
            },
            unknown
        >,
        Error
    >;
    clearAllNotifications: () => Promise<void>;
    removeNotification: (id: number) => Promise<void>;
    markNotificationRead: (id: number) => Promise<void>;
}

export interface NotificationProviderProps {
    children: React.ReactNode;
}

export const NotificationContext = createContext<NotificationContextType>(
    null as unknown as NotificationContextType
);

export const NotificationProvider = ({
    children,
}: NotificationProviderProps) => {
    const { userData } = useAuth();
    const userId = userData?._id || "";
    const router = useRouter();

    const notificationQuery = useInfiniteQuery<{
        items: NotificationRecord[];
        nextCursor: NotificationCursor | null;
    }>({
        queryKey: ["notifications", userId],
        enabled: !!userId,
        queryFn: ({ pageParam }) => getNotificationPage(userId, pageParam as NotificationCursor | null),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });
    const refetchNotifications = notificationQuery.refetch;

    const notifications = useMemo<NotificationRecord[]>(
        () => notificationQuery.data?.pages.flatMap((page) => page.items) || [],
        [notificationQuery.data]
    );

    const [
        isNotificationPermissionGranted,
        setIsNotificationPermissionGranted,
    ] = useState<boolean | null>(null);

    useEffect(() => {
        let disposed = false;
        let permissionStatus: PermissionStatus | undefined;
        const handlePermissionChange = () => {
            setIsNotificationPermissionGranted(
                "Notification" in window && Notification.permission === "granted"
            );
        };

        handlePermissionChange();

        window.addEventListener("focus", handlePermissionChange);
        document.addEventListener("visibilitychange", handlePermissionChange);
        navigator.permissions?.query({ name: "notifications" })
            .then((status) => {
                if (disposed) return;
                permissionStatus = status;
                status.onchange = handlePermissionChange;
            }).catch(() => { /* Some browsers do not expose this permission. */ });

        return () => {
            disposed = true;
            if (permissionStatus) permissionStatus.onchange = null;
            window.removeEventListener("focus", handlePermissionChange);
            document.removeEventListener("visibilitychange", handlePermissionChange);
        };
    }, []);

    useEffect(() => {
        if (!isNotificationPermissionGranted || !userId) return;
        initializeNotification().catch((error) => {
            console.error("Error initializing notifications:", error);
        });
    }, [isNotificationPermissionGranted, userId]);

    useEffect(() => {
        if (!userId || !("serviceWorker" in navigator) || !firebaseMessaging) return;
        let active = true;

        const messageHandler = async (payload: MessagePayload, fromWorker = false) => {
            if (payload.data?.recipientId && payload.data.recipientId !== userId) return;
            const results = await Promise.allSettled([
                handleForegroundMessage(payload),
                storeNotification(payload, userId),
            ]);
            results.forEach((result) => {
                if (result.status === "rejected") console.error("Error handling notification:", result.reason);
            });
            if (!active) return;
            await refetchNotifications();

            if ((payload.data?.type === NotificationType.ROOM_DELETED ||
                payload.data?.type === NotificationType.KICKED_FROM_ROOM) &&
                window.location.pathname.startsWith(`/room/${payload.data.roomId}/`)) {
                router.replace("/");
            }

            const [title, notificationOptions] =
                createNotification(payload);
            const stored = results[1].status === "fulfilled" && results[1].value;
            if (stored || payload.data?.persistent === "false" ||
                (fromWorker && document.visibilityState === "visible")) {
                toast(title, {
                    description: notificationOptions.body,
                    icon: notificationOptions.icon ? (
                        <img src={notificationOptions.icon} alt="" />
                    ) : (
                        <Bell />
                    ),
                });
            }
        };

        const unsubscribeMessage = onMessage(firebaseMessaging, (payload) => {
            messageHandler(payload).catch(console.error);
        });

        // For case user is not focus on the page and receive message
        const serviceWorkerMessageHandler = (event: MessageEvent) => {
            if (event.data?.type === "FCM_MESSAGE") {
                const payload = event.data.payload;
                messageHandler(payload, true).catch(console.error);
            } else if (event.data?.type === "NOTIFICATION_ACTION_COMPLETED") {
                const data = event.data.data;
                if (data?.recipientId && data.recipientId !== userId) return;
                if (data?.roomId) {
                    queryClient.invalidateQueries({ queryKey: presenceQueryKey(data.roomId) });
                }
                refetchNotifications().catch(console.error);
            }
        };

        navigator.serviceWorker.addEventListener(
            "message",
            serviceWorkerMessageHandler
        );

        return () => {
            active = false;
            unsubscribeMessage();
            navigator.serviceWorker.removeEventListener(
                "message",
                serviceWorkerMessageHandler
            );
        };
    }, [userId, refetchNotifications, router]);

    const clearAllNotifications = useCallback(async () => {
        if (!userId) return;
        await notificationDb.notifications.where("[userId+receivedAt]")
            .between([userId, Dexie.minKey], [userId, Dexie.maxKey], true, true).delete();
        await refetchNotifications();
    }, [userId, refetchNotifications]);

    const removeNotification = useCallback(
        async (id: number) => {
            await notificationDb.notifications.where("_id").equals(id)
                .filter((notification) => notification.userId === userId).delete();
            await refetchNotifications();
        },
        [userId, refetchNotifications]
    );

    const markNotificationRead = useCallback(async (id: number) => {
        await notificationDb.notifications.where("_id").equals(id)
            .filter((notification) => notification.userId === userId).modify({ status: "read" });
        await refetchNotifications();
    }, [userId, refetchNotifications]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                isNotificationPermissionGranted,
                notificationQuery,
                clearAllNotifications,
                removeNotification,
                markNotificationRead,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error(
            "useNotification must be used within a NotificationProvider"
        );
    }
    return context;
};
