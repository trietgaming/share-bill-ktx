import "server-only";
import { ErrorCode } from "@/enums/error";
import type {
    ActionError,
    ErrorServerActionResult,
    ServerActionResponse,
    SuccessServerActionResult,
} from "@/types/actions";
import mongoose from "mongoose";
import { ZodError } from "zod";
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

/**
 * Next.js signals internal control flow (redirect(), notFound(), and the
 * "this route reads cookies()/headers() so it can't be statically rendered"
 * bailout) by throwing an error tagged with a special `.digest`. Those must
 * propagate past this function's try/catch untouched - swallowing them into
 * a normal ErrorServerActionResult hides the signal from Next's own
 * rendering machinery, which (for the dynamic-usage case in particular)
 * turns into a hard build failure instead of the route just being marked
 * dynamic.
 */
function isNextInternalControlFlowError(error: unknown): boolean {
    const digest = (error as { digest?: unknown } | null)?.digest;
    return (
        typeof digest === "string" &&
        (digest === "DYNAMIC_SERVER_USAGE" || digest.startsWith("NEXT_"))
    );
}

export function handleServerActionError(error: any): ErrorServerActionResult {
    if (
        error instanceof mongoose.Error.ValidationError ||
        error instanceof AppError
    ) {
        return createErrorResponse(error.message, ErrorCode.INVALID_INPUT);
    }

    if (error instanceof ZodError) {
        return createErrorResponse(
            error.issues[0]?.message || "Dữ liệu không hợp lệ",
            ErrorCode.INVALID_INPUT
        );
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
     * Validates and/or narrows the raw arguments received over the wire, before
     * initContext or any precheck runs. Server actions are public HTTP endpoints:
     * the TypeScript parameter types are not enforced at runtime, so a caller can
     * send any JSON-serializable shape regardless of what ServerFunc declares.
     * Throw (e.g. a Zod parse, or `new AppError(msg, ErrorCode.INVALID_INPUT)`) to
     * reject malformed input, especially fields that must never be client-settable
     * (status, createdBy, payInfo, etc.) before they reach mass-assignment-prone
     * code like `Object.assign(doc, data)` or `new Model({...data})`.
     */
    input?: (...args: TailParams<ServerFunc>) => void;
    /**
     * Initialize context object, which will be passed to prechecks and main function.
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
        try {
            definition.input?.(...(args as TailParams<ServerFunc>));
            /// @ts-ignore
            await definition.initContext?.(context, ...args);
            if (definition.ensureDbConnection !== false) {
                await ensureDbConnection();
            }
            for (const check of definition.prechecks || []) {
                /// @ts-ignore
                await check(context, ...args);
            }

            /// @ts-ignore
            const cache = definition.cache?.(context, ...args);

            // `cache.tags` alone is NOT enough to key the cache: it is only
            // used by unstable_cache/revalidateTag for invalidation. The
            // lookup key is `keyParts` (2nd arg) + the wrapped closure's own
            // arguments (none, here). Without folding the call's actual args
            // into keyParts, two calls sharing tags but differing in e.g.
            // pagination cursor or sort order would collide on the same
            // cache entry and return each other's data.
            const cacheKeyParts = cache
                ? [...(cache.tags || []), JSON.stringify(args)]
                : undefined;

            return cache
                ? await unstable_cache(
                      async () =>
                          createSuccessResponse(
                              await definition.fn(context, ...args)
                          ),
                      cacheKeyParts,
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
            if (isNextInternalControlFlowError(error)) {
                throw error;
            }
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
