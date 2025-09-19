"use client";
import { firebaseMessaging } from "@/lib/firebase/client";
import { initializeNotification } from "@/lib/notification/notification";
import { onMessage } from "firebase/messaging";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Dexie, { EntityTable } from "dexie";
import { NotificationPayload } from "@firebase/messaging";
import { DefinedUseInfiniteQueryResult, InfiniteData, useInfiniteQuery, UseInfiniteQueryResult, useQuery } from "@tanstack/react-query";
import { createNotification } from "@/lib/notification/notification-factory";
import { ForegroundNotification } from "@/types/notification";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { useAuth } from "./auth-context";
import { notificationDb } from "@/lib/notification/notification-db";

export interface NotificationContextType {
    isNotificationPermissionGranted: boolean | null;
    notifications: (ForegroundNotification & { _id: number })[];
    notificationQuery: UseInfiniteQueryResult<InfiniteData<{
        items: (ForegroundNotification & {
            _id: number;
        })[];
        nextCursor: number | null;
    }, unknown>, Error>,
    clearAllNotifications: () => Promise<void>;
    removeNotification: (id: number) => Promise<void>;
}

export interface NotificationProviderProps {
    children: React.ReactNode;
}

export const NotificationContext = createContext<NotificationContextType>(null as unknown as NotificationContextType);

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
    const { userData } = useAuth();

    const notificationQuery = useInfiniteQuery<{
        items: (ForegroundNotification & {
            _id: number;
        })[];
        nextCursor: number | null;
    }>({
        queryKey: ['notifications'],
        queryFn: async ({ pageParam }) => {
            const PAGE_SIZE = 20;

            const query = notificationDb.notifications
                .where(["userId", "receivedAt"])
                .between([userData?._id || '', 0], [userData?._id || '', pageParam || Date.now()], true, true)
                .reverse()
                .limit(PAGE_SIZE)
                .toArray();

            const items = await query;

            const nextCursor = items.length == PAGE_SIZE ? items[items.length - 1].receivedAt - 1 : null;

            return { items, nextCursor };
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    })

    const notifications = useMemo(
        () => notificationQuery.data?.pages.flatMap(page => page.items) || [],
        [notificationQuery.data]
    );

    const [isNotificationPermissionGranted, setIsNotificationPermissionGranted] = useState<boolean | null>(null);

    useEffect(() => {
        const handlePermissionChange = () => {
            setIsNotificationPermissionGranted(Notification.permission === 'granted');
        };

        handlePermissionChange();

        navigator.permissions.query({ name: 'notifications' }).then((permissionStatus) => {
            permissionStatus.onchange = handlePermissionChange;
        });

        return () => {
            navigator.permissions.query({ name: 'notifications' }).then((permissionStatus) => {
                permissionStatus.onchange = null;
            });
        };
    }, [])

    useEffect(() => {
        if (!isNotificationPermissionGranted) {
            return;
        }

        initializeNotification();

        const unsubscribeMessage = onMessage(firebaseMessaging, async (payload) => {
            const [title, notificationOptions, additionalData] = createNotification(payload);
            const notification: ForegroundNotification & { userId: string } = {
                title,
                ...notificationOptions,
                ...additionalData,
                userId: userData?._id || '',
            }

            await notificationDb.notifications.add(notification);
            await notificationQuery.refetch();

            toast(notification.title, {
                description: notification.body,
                icon: notification.icon ? <img src={notification.icon} alt="" /> : <Bell />,
            })
        })

        return unsubscribeMessage;
    }, [isNotificationPermissionGranted]);

    const clearAllNotifications = useCallback(async () => {
        await notificationDb.notifications.clear();
        await notificationQuery.refetch();
    }, [notificationDb, notificationQuery]);

    const removeNotification = useCallback(async (id: number) => {
        await notificationDb.notifications.delete(id);
        await notificationQuery.refetch();
    }, [notificationDb, notificationQuery]);

    return <NotificationContext.Provider value={{
        notifications,
        isNotificationPermissionGranted,
        notificationQuery,
        clearAllNotifications,
        removeNotification
    }}>
        {children}
    </NotificationContext.Provider>
}

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
}