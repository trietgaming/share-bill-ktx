"use client";

import { firebaseClientAuth } from "@/lib/firebase/client";
import { setAuthCookie } from "@/lib/firebase/server";
import type { IUserData } from "@/types/UserData";
import { User } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
    user: User | null;
    userData: IUserData | null;
}

interface AuthContextProps {
    children: any;
    initialUser: User | null;
    initialUserData: IUserData | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null
});

export const AuthProvider = ({ children, initialUser, initialUserData }: AuthContextProps) => {
    const [user, setUser] = useState<User | null>(initialUser);
    const [userData, setUserData] = useState<IUserData | null>(initialUserData);

    useEffect(() => {
        const unsubscribeAuthStateChanged = firebaseClientAuth.onAuthStateChanged(
            (authUser) => {
                setUser(authUser);
            }
        );

        const unsubscribeIdTokenChanged = firebaseClientAuth.onIdTokenChanged(
            (authUser) => {
                // Set cookie for server-side authentication
                authUser?.getIdToken().then((idToken) => {
                    setAuthCookie(idToken);
                });
            })

        return () => {
            unsubscribeAuthStateChanged();
            unsubscribeIdTokenChanged();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, userData }}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
