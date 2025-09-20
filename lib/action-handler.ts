import { ServerActionResponse } from "@/types/actions";
import { ServerActionError } from "@/lib/errors";

/**
 * This must be called before every execution of server actions. 
 * Handle a server action and return the result or throw an error.
 * @param actionPromise A server action that returns ServerActionResponse<T>
 * @returns The data from the server action response
 */
export async function handleAction<T>(
    actionPromise: ServerActionResponse<T>
): Promise<T> {
    const result = await actionPromise;
    if (result.error) {
        throw new ServerActionError(result.error);
    }
    return result.data;
}
