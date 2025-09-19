import { ServerActionResponse } from "@/types/actions";
import { ServerActionError } from "@/lib/errors";

export async function handleAction<T>(actionPromise: ServerActionResponse<T>): Promise<T> {
    const result = await actionPromise;
    if (result.error) {
        throw new ServerActionError(result.error);
    }
    return result.data;
}