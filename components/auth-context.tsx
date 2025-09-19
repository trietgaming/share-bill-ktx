"use client";

import { handleAction } from "@/lib/action-handler";
import { getAuthenticatedUserData } from "@/lib/actions/user-data";
import { LOGIN_PATH, PUBLIC_PATHS } from "@/lib/app-constants";
import { firebaseClientAuth } from "@/lib/firebase/client";
import { setAuthCookie } from "@/lib/firebase/server";
import type { IUserDataWithBankAccounts } from "@/types/user-data";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";

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
    const pathname = usePathname();
    const router = useRouter();

    const isProtectedRoute = !PUBLIC_PATHS.includes(pathname);
    const isLoginRoute = pathname === LOGIN_PATH;

    useEffect(() => {
        const unsubscribeAuthStateChanged = firebaseClientAuth.onAuthStateChanged(
            async (authUser) => {
                if (!authUser) {
                    setUserData(null);
                    return;
                }
                if (authUser?.uid !== userData?._id) {
                    const newUserData = await handleAction(getAuthenticatedUserData(await authUser?.getIdToken()));
                    console.log("Auth state changed, new user data:", newUserData)
                    setUserData(newUserData);
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

    useEffect(() => {
        if (isProtectedRoute && !userData && !isLoginRoute) {
            router.push(`${LOGIN_PATH}?cb=${pathname}`);
            return;
        }

        if (isLoginRoute && userData) {
            const searchCb = new URLSearchParams(window.location.search).get("cb");

            if (searchCb && searchCb.startsWith("/") && !searchCb.startsWith("//")) {
                router.replace(searchCb);
            }
            else {
                router.replace("/")
            }
        }

    }, [userData]);

    return (
        <AuthContext.Provider value={{ userData, setUserData }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
