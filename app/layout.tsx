import "server-only";
import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/components/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import { getAuthenticatedUserData } from "@/lib/actions/user-data";
import { queryClient } from "@/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ConfirmModalProvider } from "@/components/are-you-sure";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Share bill KTX",
    description: "Created with v0",
};

const fontHeading = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-heading",
});

const fontBody = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-body",
});

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const authenticatedUserData = await getAuthenticatedUserData();

    return (
        <html lang="vi">
            <body
                className={cn(
                    "antialiased",
                    fontHeading.variable,
                    fontBody.variable
                )}
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
            <Toaster richColors closeButton />
        </body>
        </html >
    );
}
