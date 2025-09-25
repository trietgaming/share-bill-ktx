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
import { unstable_cache } from "next/cache";

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
    ServerFunc extends (...args: any[]) => Promise<any>,
    ArgsType extends any[] = Parameters<ServerFunc>
> = {
    /**
     * Initialize context object, which will be passed to prechecks and main function
     */
    initContext?: (context: any, ...args: ArgsType) => any;
    /**
     * Prechecks to run before main function
     * If any precheck throws an error, the main function will not be executed
     * and the error will be returned to the client.
     * Prechecks can access and modify the context object.
     *
     * Prechecks can be dependent on each other, so the order matters.
     */
    prechecks?: Array<(context: any, ...args: ArgsType) => Promise<any> | any>;
    /** Main server action function, must define context within this fn */
    fn: (context: any, ...args: ArgsType) => ReturnType<ServerFunc>;
    cache?: (context: any, ...args: ArgsType) => {
        duration?: number;
        tags?: string[];
    } | null;
};

type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Must define the generic ServerFunc explicitly when calling this function.
 */
export function serverAction<
    ServerFunc extends (...args: any[]) => Promise<any>
>(
    definition: ServerActionDefinition<ServerFunc>
): (
    ...args: Parameters<ServerFunc>
) => ServerActionResponse<Awaited<ReturnType<ServerFunc>>> {
    const returnFn = async function (...args: Parameters<ServerFunc>) {
        const context: any = {};
        await definition.initContext?.(context, ...args);
        try {
            for (const check of definition.prechecks || []) {
                await check(context, ...args);
            }

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
                        revalidate: cache.duration || 60 * 60, // default 1 hour
                    }
                )()
                : createSuccessResponse(await definition.fn(context, ...args));
        } catch (error) {
            return handleServerActionError(error) as ReturnType<ServerFunc>;
        }
    } as ServerFunc;

    return returnFn;
}
