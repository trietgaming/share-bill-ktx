"use server";
import { getAuth } from "firebase/auth";
import { initializeApp, initializeServerApp } from "firebase/app";
import { firebaseConfig } from "./config";
import { cookies } from "next/headers";

export async function getAuthenticatedUser(authIdToken?: string) {
    const firebaseServerApp = initializeServerApp(
        initializeApp(firebaseConfig),
        {
            authIdToken,
        }
    );

    const auth = getAuth(firebaseServerApp);
    await auth.authStateReady();

    return auth.currentUser;
}

export async function setAuthCookie(authIdToken?: string) {
    const firebaseServerApp = initializeServerApp(
        initializeApp(firebaseConfig),
        {
            authIdToken,
        }
    );

    const auth = getAuth(firebaseServerApp);
    await auth.authStateReady();

    const requestCookies = await cookies();

    if (!auth.currentUser) {
        requestCookies.delete("__session");
        return;
    }

    requestCookies.set("__session", authIdToken as string, {
        sameSite: "strict",
        httpOnly: true,
    });
}
