"use client";
import { initializeNotification } from "@/lib/notification";
import { createContext, useContext, useEffect, useState } from "react";

export interface NotificationContextType {
    isNotificationPermissionGranted: boolean | null;
    notifications: any[];
}

export interface NotificationProviderProps {
    children: React.ReactNode;
}

export const NotificationContext = createContext<NotificationContextType>(null as unknown as NotificationContextType);

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isNotificationPermissionGranted, setIsNotificationPermissionGranted] = useState<boolean | null>(null);

    useEffect(() => {
        setIsNotificationPermissionGranted(Notification.permission === 'granted');

        const handlePermissionChange = () => {
            setIsNotificationPermissionGranted(Notification.permission === 'granted');
        };


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
    }, [isNotificationPermissionGranted]);


    return <NotificationContext.Provider value={{ notifications, isNotificationPermissionGranted }}>
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