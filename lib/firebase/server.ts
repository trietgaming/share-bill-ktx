"use server";
import { getAuth, User } from "firebase/auth";
import { initializeApp, initializeServerApp } from "firebase/app";
import { firebaseConfig } from "./config";
import { cookies } from "next/headers";

async function getAuthUserFromIdToken(idToken?: string | null) {
    if (!idToken) return null;


    const firebaseServerApp = initializeServerApp(
        initializeApp(firebaseConfig),
        {
            authIdToken: idToken,
        }
    );

    const auth = getAuth(firebaseServerApp);
    await auth.authStateReady();

    return auth.currentUser;
}

/**
 * This result should not be passed directly to client components or server components that can be rendered on the client
 * because the result did not go through any serialization process.
 */
export async function getAuthenticatedUser() {
    const requestCookies = await cookies();
    const idToken = requestCookies.get("__session")?.value;

    let user = await getAuthUserFromIdToken(idToken);

    if (!user) {
        const refreshToken = requestCookies.get("__refreshToken")?.value;

        if (refreshToken) {
            const newIdToken = await exchangeRefreshTokenForIdToken(refreshToken);

            user = await getAuthUserFromIdToken(newIdToken);
        }
    }

    return user as User;
}

interface RefreshTokenResponse {
    expires_in: string
    token_type: "Bearer"
    refresh_token: string
    id_token: string
    user_id: string
    project_id: string
}

async function exchangeRefreshTokenForIdToken(refreshToken: string) {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) throw new Error("FIREBASE_API_KEY is not set");

    const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }).toString(),
    });

    if (!response.ok) throw new Error("Failed to exchange refresh token");

    const data = await response.json() as RefreshTokenResponse;

    return data.id_token;
}

export async function setAuthRefreshTokenCookie(refreshToken?: string | null) {
    const requestCookies = await cookies();

    if (!refreshToken) {
        requestCookies.delete("__refreshToken");
        return setAuthCookie(null);
    }

    // Verify if the refresh token is valid by exchanging it for an ID token
    const idToken = await exchangeRefreshTokenForIdToken(refreshToken);

    requestCookies.set("__refreshToken", refreshToken, {
        sameSite: "strict",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    });

    await setAuthCookie(idToken);
}

/**
 * This will not check if the ID token is valid or not. 
 */
export async function setAuthCookie(authIdToken?: string | null) {
    const requestCookies = await cookies();

    if (!authIdToken) {
        requestCookies.delete("__session");
        return;
    }

    requestCookies.set("__session", authIdToken as string, {
        sameSite: "strict",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 // 1 hour
    });
}
