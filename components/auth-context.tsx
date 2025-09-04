"use client";

import { firebaseClientAuth } from "@/lib/firebase/client";
import { setAuthCookie } from "@/lib/firebase/server";
import { User } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
    user: User | null;
}

interface AuthContextProps {
    children: any;
    initialUser: User | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
});

export const AuthProvider = ({ children, initialUser }: AuthContextProps) => {
    const [user, setUser] = useState<User | null>(initialUser);

    useEffect(() => {
        const unsubscribe = firebaseClientAuth.onAuthStateChanged(
            (authUser) => {
                // Set cookie for server-side authentication
                authUser?.getIdToken().then((idToken) => {
                    setAuthCookie(idToken);
                });

                setUser(authUser);
            }
        );

        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
