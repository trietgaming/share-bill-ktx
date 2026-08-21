"use server";

import { setAuthCookie, setAuthRefreshTokenCookie } from "./server";

/**
 * Thin, client-callable Server Actions. Kept in a separate "use server" file
 * from ./server.ts so internal helpers (getAuthenticatedUser, token exchange, etc.)
 * never become publicly invocable action endpoints.
 */

export async function setSessionCookie(idToken?: string | null) {
    return setAuthCookie(idToken);
}

export async function setSessionRefreshTokenCookie(
    refreshToken?: string | null
) {
    return setAuthRefreshTokenCookie(refreshToken);
}
