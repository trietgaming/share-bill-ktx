import "server-only";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { getAuthenticatedUser } from "@/lib/firebase/server";
import { AuthProvider } from "@/components/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { getUserDataById } from "@/lib/user-data";
import { Navbar } from "@/components/navbar";
import "./globals.css";

export const metadata: Metadata = {
    title: "Share bill KTX",
    description: "Created with v0",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const authenticatedUser = await getAuthenticatedUser();
    const userData = authenticatedUser ? await getUserDataById(authenticatedUser.uid) : null;

    return (
        <html lang="en">
            <body
                className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}
            >
                <AuthProvider initialUser={authenticatedUser} initialUserData={userData}>
                    <Navbar />
                    {children}
                </AuthProvider>
                <Analytics />
                <Toaster />
            </body>
        </html>
    );
}
