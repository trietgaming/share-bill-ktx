import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthenticatedUser } from "./lib/firebase/server";

// const protectedRoutes = ["/"];
const publicRoutes = ["/login"];
const authRoutes = ["/login"];

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    // const isProtectedRoute = protectedRoutes.includes(path);
    const isPublicRoute = publicRoutes.includes(path);
    const isAuthRoute = authRoutes.includes(path);

    const user = await getAuthenticatedUser();

    if (!isPublicRoute && !user) {
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    if (user && isAuthRoute) {
        return NextResponse.redirect(new URL("/", req.nextUrl));
    }

    return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
