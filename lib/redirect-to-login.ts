import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function isRelativePath(path: string): boolean {
    if (typeof path !== 'string') {
        return false;
    }
    // Regex: Bắt đầu bằng '/', theo sau không phải là '/' hoặc '\'
    // và không chứa các ký tự không mong muốn có thể dẫn đến domain khác.
    const relativePathRegex = /^\/([^\/\\]|$)[\w\/\-\?\.=&%#]*$/;
    return relativePathRegex.test(path);
}

export async function redirectToLoginPage() {
    const headersList = await headers();
    const referer = headersList.get("referer");
    let unsafeCallbackUrl = "";

    if (referer) {
        try {
            const parsedUrl = new URL(referer);

            if (parsedUrl.origin === process.env.APP_ORIGIN) {
                unsafeCallbackUrl = parsedUrl.pathname + parsedUrl.search;
            }
        } catch {
            unsafeCallbackUrl = referer;
        }
    }
    const callbackUrl = isRelativePath(unsafeCallbackUrl) ? unsafeCallbackUrl : "";

    return redirect("/login" + (callbackUrl ? `?cb=${encodeURIComponent(callbackUrl)}` : ""));
}
