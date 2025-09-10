import "server-only";
import { redirectToLoginPage } from "@/lib/redirect-to-login";
import { getAuthenticatedUser } from "@/lib/firebase/server";

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