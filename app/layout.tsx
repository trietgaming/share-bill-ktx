import "server-only";
import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { getAuthenticatedUser } from "@/lib/firebase/server";
import { AuthProvider } from "@/components/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import { getAuthenticatedUserData } from "@/lib/actions/user-data";
import { queryClient } from "@/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ConfirmModalProvider } from "@/components/are-you-sure";

export const metadata: Metadata = {
    title: "Share bill KTX",
    description: "Created with v0",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const authenticatedUserData = await getAuthenticatedUserData();

    return (
        <html lang="en">
            <body
                className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}
            >
                <QueryClientProvider client={queryClient}>
                    <AuthProvider initialUserData={authenticatedUserData}>
                        <ConfirmModalProvider>
                            <Navbar />
                            {children}
                        </ConfirmModalProvider>
                    </AuthProvider>
                </QueryClientProvider>
                <Analytics />
                <Toaster />
            </body>
        </html>
    );
}
