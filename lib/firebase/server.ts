// Edge runtime
"use server";
import { cookies } from "next/headers";
import * as jose from "jose";
import type { DecodedIdToken } from "@/types/auth";
import { LRUCache } from "lru-cache";

// Better use Redis or Memcached for production
const publicKeyMap = new LRUCache<string, jose.CryptoKey>({
    max: 5,
    ttl: 1000 * 60 * 60, // 1 hour
});
const idTokenCache = new LRUCache<string, DecodedIdToken>({
    max: 1000,
    ttl: 1000 * 60 * 15, // 15 minutes
});

const sessionPublicKeyResolver: jose.JWTVerifyGetKey = async (
    protectedHeader
) => {
    const { kid, alg } = protectedHeader;
    if (!kid || !alg) {
        throw new Error("Invalid token");
    }

    if (!publicKeyMap.has(kid)) {
        const publicKeys = await fetch(
            "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
        ).then((response) => response.json());

        const publicKey = publicKeys[kid];

        if (!publicKey) {
            throw new Error("Invalid token");
        }

        publicKeyMap.set(kid, await jose.importX509(publicKey, alg));
    }

    return publicKeyMap.get(kid)!;
};

async function getAuthUserFromIdToken(
    idToken?: string | null
): Promise<DecodedIdToken | null> {
    if (!idToken) return null;

    const now = Date.now() / 1000;
    const cachedToken = idTokenCache.get(idToken);
    if (cachedToken && cachedToken.exp > now) {
        return cachedToken;
    }

    idTokenCache.delete(idToken);

    try {
        const verifiedToken = await jose.jwtVerify(
            idToken,
            sessionPublicKeyResolver,
            {
                issuer: `https://securetoken.google.com/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`,
                audience: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            }
        );

        const payload = verifiedToken.payload as DecodedIdToken;
        // For compatibility (The id token itself does not have 'uid' field)
        payload.uid = payload.user_id;

        if (
            // Not matching sub and uid
            payload.sub !== payload.user_id ||
            // Expired
            payload.exp <= now ||
            // Issued in the future
            payload.iat >= now ||
            // Auth time in the future
            payload.auth_time >= now
        ) {
            return null;
        }

        idTokenCache.set(idToken, payload);
        return payload;
    } catch (error) {
        return null;
    }
}

/**
 * This result should not be passed directly to client components or server components that can be rendered on the client
 * because the result did not go through any serialization process.
 */
export async function getAuthenticatedUser(_idToken?: string | null) {
    const requestCookies = await cookies();
    const idToken = _idToken ?? requestCookies.get("__session")?.value;

    let user = await getAuthUserFromIdToken(idToken);

    if (!user) {
        const refreshToken = requestCookies.get("__refreshToken")?.value;

        if (refreshToken) {
            const newIdToken = await exchangeRefreshTokenForIdToken(
                refreshToken
            );

            user = await getAuthUserFromIdToken(newIdToken);
        }
    }

    return user;
}

interface RefreshTokenResponse {
    expires_in: string;
    token_type: "Bearer";
    refresh_token: string;
    id_token: string;
    user_id: string;
    project_id: string;
}

async function exchangeRefreshTokenForIdToken(refreshToken: string) {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) throw new Error("FIREBASE_API_KEY is not set");

    const response = await fetch(
        `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }).toString(),
        }
    );

    if (!response.ok) throw new Error("Failed to exchange refresh token");

    const data = (await response.json()) as RefreshTokenResponse;

    return data.id_token;
}

export async function setAuthRefreshTokenCookie(refreshToken?: string | null) {
    const requestCookies = await cookies();

    if (!refreshToken) {
        requestCookies.delete("__refreshToken");
        return setAuthCookie(null);
    }

    try {
        // Verify if the refresh token is valid by exchanging it for an ID token
        const idToken = await exchangeRefreshTokenForIdToken(refreshToken);

        await requestCookies.set("__refreshToken", refreshToken, {
            sameSite: "lax",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            expires: Date.now() + 60 * 60 * 24 * 365 * 1000, // 1 year
        });

        await setAuthCookie(idToken);
    } catch (error) {
        requestCookies.delete("__refreshToken");
        return setAuthCookie(null);
    }
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
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60, // 1 hour
    });
}
