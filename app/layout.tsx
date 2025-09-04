import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { cookies } from "next/headers";
import "./globals.css";
import { getAuthenticatedUser } from "@/lib/firebase/server";
import { AuthProvider } from "@/components/auth-context";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
    title: "Share bill KTX",
    description: "Created with v0",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const requestCookies = await cookies();
    const idToken = requestCookies.get("idToken")?.value;

    const authenticatedUser = await getAuthenticatedUser(idToken);

    return (
        <html lang="en">
            <body
                className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}
            >
                <AuthProvider initialUser={authenticatedUser}>
                    {children}
                </AuthProvider>
                <Analytics />
                <Toaster />
            </body>
        </html>
    );
}
