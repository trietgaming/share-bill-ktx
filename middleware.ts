import "server-only";
import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "./lib/firebase/server";
import { LOGIN_PATH, PUBLIC_PATHS } from "./lib/app-constants";

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const query = req.nextUrl.search;
    // const isProtectedRoute = protectedRoutes.includes(path);
    const isPublicRoute = PUBLIC_PATHS.includes(path);
    const isAuthRoute = path === LOGIN_PATH;

    const user = await getAuthenticatedUser();
    console.log("Authenticated: ", !!user);

    if (!isPublicRoute && !user) {
        return NextResponse.redirect(
            new URL(`/login?cb=${req.nextUrl.pathname}${query}`, req.nextUrl)
        );
    }

    if (user && isAuthRoute) {
        return NextResponse.redirect(new URL("/", req.nextUrl));
    }

    return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
    matcher: [
        {
            source: "/((?!api|firebase-messaging-sw.js|_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.ico$).*)",
            missing: [
                {
                    type: "header",
                    key: "next-action",
                },
            ],
        },
    ],
};
