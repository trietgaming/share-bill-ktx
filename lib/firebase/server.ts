"use server";
import { getAuth, User } from "firebase/auth";
import { initializeApp, initializeServerApp } from "firebase/app";
import { firebaseConfig } from "./config";
import { cookies } from "next/headers";

export async function getAuthenticatedUser() {
    const requestCookies = await cookies();
    const idToken = requestCookies.get("__session")?.value;

    const firebaseServerApp = initializeServerApp(
        initializeApp(firebaseConfig),
        {
            authIdToken: idToken,
        }
    );

    const auth = getAuth(firebaseServerApp);
    await auth.authStateReady();

    return (auth.currentUser?.toJSON() as User) || null;
}

export async function setAuthCookie(authIdToken?: string | null) {
    const firebaseServerApp = initializeServerApp(
        initializeApp(firebaseConfig),
        {
            authIdToken: authIdToken || void 0,
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
