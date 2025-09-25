import "server-only";
import { ErrorCode } from "@/enums/error";
import type {
    ActionError,
    ErrorServerActionResult,
    ServerActionResponse,
    SuccessServerActionResult,
} from "@/types/actions";
import mongoose from "mongoose";
import { AppError, AppValidationError } from "./errors";
import { revalidateTag, unstable_cache } from "next/cache";
import { ensureDbConnection } from "./db-connect";

export function createErrorResponse(
    error: ActionError
): ErrorServerActionResult;

export function createErrorResponse(
    message: string,
    code: ErrorCode
): ErrorServerActionResult;

export function createErrorResponse(
    message: string | ActionError,
    code?: ErrorCode
): ErrorServerActionResult {
    return {
        success: false,
        data: null,
        error:
            typeof message == "string"
                ? {
                      message,
                      code: code as ErrorCode,
                  }
                : message,
    };
}

export function createSuccessResponse<T>(
    data: T
): SuccessServerActionResult<T> {
    return {
        success: true,
        data,
        error: null,
    };
}

// type SuccessPrechecksResult<T extends readonly Promise<any>[]> = {
//     error: null;
//     data: { [K in keyof T]: T[K] extends Promise<infer U> ? U : never };
// };

// type ErrorPrechecksResult = {
//     error: ActionError;
//     data: null;
// };

// type PrechecksResult<T extends readonly Promise<any>[]> =
//     | SuccessPrechecksResult<T>
//     | ErrorPrechecksResult;

// export async function batchPrechecks<T extends readonly Promise<any>[]>(
//     checks: T
// ): Promise<PrechecksResult<T>> {
//     const result = [] as SuccessPrechecksResult<T>["data"];
//     for (let i = 0; i < checks.length; ++i) {
//         const [data, error] = await checks[i];
//         if (error) {
//             return {
//                 error,
//                 data: null,
//             };
//         }
//         (result as any[]).push(data);
//     }
//     return {
//         error: null,
//         data: result,
//     };
// }

export function handleServerActionError(error: any): ErrorServerActionResult {
    if (
        error instanceof mongoose.Error.ValidationError ||
        error instanceof AppError
    ) {
        return createErrorResponse(error.message, ErrorCode.INVALID_INPUT);
    }

    console.error("Unexpected server action error:", error);
    return createErrorResponse("Đã có lỗi xảy ra", ErrorCode.UNKNOWN);
}

export type ServerActionDefinition<
    ServerFunc extends (...args: any[]) => Promise<any>
> = {
    /** Main server action function, must not use cookies within this function */
    fn: ServerFunc;
    ensureDbConnection?: boolean;
    /**
     * Initialize context object, which will be passed to prechecks and main function.
     * Errors in this will not be caught and will result in 500 error.
     */
    initContext?: (...args: Parameters<ServerFunc>) => any;
    /**
     * Prechecks to run before main function
     * If any precheck throws an error, the main function will not be executed
     * and the error will be returned to the client.
     * Prechecks can access and modify the context object.
     *
     * Prechecks can be dependent on each other, so the order matters.
     */
    prechecks?: ((...args: Parameters<ServerFunc>) => Promise<any> | any)[];
    /**
     * This context doesn't include context from fn.
     */
    cache?: (...args: Parameters<ServerFunc>) => {
        duration?: number;
        tags?: string[];
    } | null;
};

type Awaited<T> = T extends Promise<infer U> ? U : T;
type TailParams<T extends (...args: any) => any> = T extends (
    _: any,
    ...args: infer P
) => any
    ? P
    : never;

/**
 * Must define fn first for type inference to work.
 *
 * Flow: initContext -> prechecks[0] -> prechecks[1] -> ... -> cache (init cache) -> fn
 */
export function serverAction<
    ServerFunc extends (...args: any[]) => Promise<any>
>(
    definition: ServerActionDefinition<ServerFunc>
): (
    ...args: TailParams<ServerFunc>
) => ServerActionResponse<Awaited<ReturnType<ServerFunc>>> {
    const returnFn = async function (...args: any[]) {
        const context: any = {};
        /// @ts-ignore
        await definition.initContext?.(context, ...args);
        try {
            if (definition.ensureDbConnection !== false) {
                await ensureDbConnection();
            }
            for (const check of definition.prechecks || []) {
                /// @ts-ignore
                await check(context, ...args);
            }

            /// @ts-ignore
            const cache = definition.cache?.(context, ...args);

            return cache
                ? await unstable_cache(
                      async () =>
                          createSuccessResponse(
                              await definition.fn(context, ...args)
                          ),
                      cache.tags,
                      {
                          tags: cache.tags,
                          revalidate:
                              cache.duration && cache.duration > 0
                                  ? cache.duration
                                  : 60 * 60, // default 1 hour
                      }
                  )()
                : createSuccessResponse(await definition.fn(context, ...args));
        } catch (error) {
            return handleServerActionError(error) as ReturnType<ServerFunc>;
        }
    };

    return returnFn as any;
}

export function revalidateTags(tags: string | string[]) {
    if (Array.isArray(tags)) {
        for (const tag of tags) {
            revalidateTag(tag);
        }
    } else {
        revalidateTag(tags);
    }
}
