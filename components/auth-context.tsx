"use client";

import { getAuthenticatedUserData } from "@/lib/actions/user-data";
import { firebaseClientAuth } from "@/lib/firebase/client";
import { setAuthCookie } from "@/lib/firebase/server";
import type { IUserDataWithBankAccounts } from "@/types/user-data";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
    userData: IUserDataWithBankAccounts | null;
    setUserData: React.Dispatch<React.SetStateAction<IUserDataWithBankAccounts | null>>
}

interface AuthProviderProps {
    children: any;
    initialUserData: IUserDataWithBankAccounts | null;
}

const AuthContext = createContext<AuthContextType>({
    userData: null,
    setUserData: () => { },
});

export const AuthProvider = ({ children, initialUserData }: AuthProviderProps) => {
    const [userData, setUserData] = useState<IUserDataWithBankAccounts | null>(initialUserData);
    
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
        <AuthContext.Provider value={{ userData, setUserData }}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
