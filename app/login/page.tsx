"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ComponentProps, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthErrorCodes } from "firebase/auth";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";
import { logIn } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { WebviewNotSupported } from "@/components/webview-not-supported";

const GoogleLogo = (props: ComponentProps<"svg">) => (
    <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        {...props}
    >
        <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        ></path>
        <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        ></path>
        <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        ></path>
        <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        ></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);

function checkWebView() {
    const userAgent = navigator.userAgent.toLowerCase();

    // Kiểm tra các WebView phổ biến
    return (
        // Android WebView
        userAgent.includes("wv") ||
        // iOS WebView - có AppleWebKit nhưng không có Safari
        (userAgent.includes("applewebkit") && !userAgent.includes("safari")) ||
        // Facebook WebView
        userAgent.includes("fban") ||
        userAgent.includes("fbav") ||
        // Instagram WebView
        userAgent.includes("instagram") ||
        // Line WebView
        userAgent.includes("line") ||
        // WeChat WebView
        userAgent.includes("micromessenger") ||
        // Twitter WebView
        userAgent.includes("twitter") ||
        // Zalo WebView
        userAgent.includes("zalo") ||
        // Cordova/PhoneGap
        "cordova" in window ||
        // Android WebView pattern
        (/android.*applewebkit.*(version\/[\d\.]+).*mobile/i.test(userAgent) &&
            !/chrome\/[\d\.]+/i.test(userAgent)) ||
        // iOS WebView pattern
        (/(iphone|ipad).*applewebkit/i.test(userAgent) &&
            !/safari/i.test(userAgent) &&
            !/crios|fxios/i.test(userAgent))
    );
}

export default function LoginPage() {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isWebView, setIsWebView] = useState(false);

    const router = useRouter();

    const searchParams = useSearchParams();

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);

        try {
            await logIn();

            const searchCb = searchParams.get("cb");

            if (
                searchCb &&
                searchCb.startsWith("/") &&
                !searchCb.startsWith("//")
            ) {
                router.replace(searchCb);
            } else {
                router.replace("/");
            }
        } catch (error) {
            // Only set state in catch block since we'll redirect user to / when logged in
            setIsLoggingIn(false);

            if (!(error instanceof Error)) {
                toast.error("Đã có lỗi xảy ra khi đăng nhập.");
                return;
            }
            if (error instanceof FirebaseError) {
                if (
                    error.code === AuthErrorCodes.POPUP_CLOSED_BY_USER ||
                    error.code === "auth/cancelled-popup-request"
                ) {
                    return;
                }
            }
            toast.error("Đã có lỗi xảy ra khi đăng nhập: " + error.message);
        }
    };

    useEffect(() => {
        if (checkWebView()) {
            setIsWebView(true);
        }
    }, []);

    if (isWebView) {
        return <WebviewNotSupported />;
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md mx-auto shadow-lg">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <GoogleLogo className="w-16 h-16" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                        Đăng nhập
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Sử dụng tài khoản Google của bạn để tiếp tục
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Button
                        onClick={handleGoogleLogin}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
                        size="lg"
                        disabled={isLoggingIn}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            className="fill-current"
                        >
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Đăng nhập với Google
                    </Button>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Bằng cách đăng nhập, bạn đồng ý với{" "}
                            <a
                                href="#"
                                className="text-primary hover:underline"
                            >
                                Điều khoản dịch vụ
                            </a>{" "}
                            và{" "}
                            <a
                                href="#"
                                className="text-primary hover:underline"
                            >
                                Chính sách bảo mật
                            </a>{" "}
                            của chúng tôi.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
