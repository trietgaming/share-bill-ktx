"use client";

import { getAuthenticatedUserData } from "@/lib/actions/user-data";
import { firebaseClientAuth } from "@/lib/firebase/client";
import { setAuthCookie } from "@/lib/firebase/server";
import type { IUserData } from "@/types/UserData";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
    userData: IUserData | null;
}

interface AuthProviderProps {
    children: any;
    initialUserData: IUserData | null;
}

const AuthContext = createContext<AuthContextType>({
    userData: null
});

export const AuthProvider = ({ children, initialUserData }: AuthProviderProps) => {
    const [userData, setUserData] = useState<IUserData | null>(initialUserData);

    useEffect(() => {
        const unsubscribeAuthStateChanged = firebaseClientAuth.onAuthStateChanged(
            async (authUser) => {
                if (authUser?.uid !== userData?._id) {
                    setUserData(await getAuthenticatedUserData());
                }
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
        <AuthContext.Provider value={{ userData }}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
