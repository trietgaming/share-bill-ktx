import "server-only";
import { redirectToLoginPage } from "@/lib/redirect-to-login";
import { getAuthenticatedUser } from "@/lib/firebase/server";
import { DecodedIdToken } from "@/types/auth";
import { PrecheckError } from "../errors";
import { ErrorCode } from "@/enums/error";

/**
 * Ensures the user is authenticated, otherwise redirects to the login page.
 */
export async function authenticate() {
    const user = await getAuthenticatedUser();

    if (!user) {
        return redirectToLoginPage();
    }

    return user;
}

export interface UserCtx {
    user: DecodedIdToken;
}

export async function _authenticate(context: UserCtx) {
    const user = (await getAuthenticatedUser()) as DecodedIdToken;

    if (!user) {
        throw new PrecheckError(
            "Người dùng chưa đăng nhập",
            ErrorCode.USER_NOT_LOGGED_IN
        );
    }

    context.user = user;
}
