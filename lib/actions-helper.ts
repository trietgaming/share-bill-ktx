import "server-only";
import { ErrorCode } from "@/enums/error";
import type {
    ActionError,
    ErrorServerActionResult,
    SuccessServerActionResult,
} from "@/types/actions";
import mongoose from "mongoose";
import { AppError, AppValidationError } from "./errors";

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
    if (error instanceof mongoose.Error.ValidationError || error instanceof AppError) {
        return createErrorResponse(error.message, ErrorCode.INVALID_INPUT);
    }

    console.error("Unhandled server action error:", error);
    return createErrorResponse("Đã có lỗi xảy ra", ErrorCode.UNKNOWN);
}
