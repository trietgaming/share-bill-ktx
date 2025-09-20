import { ErrorCode } from "@/enums/error";
import type { ErrorServerActionResult, SuccessServerActionResult } from "@/types/actions";
import { NextResponse } from "next/server";

export function responseWithError(message: string, code: ErrorCode, status: number) {
    return NextResponse.json<ErrorServerActionResult>({
        success: false,
        data: null,
        error: {
            message,
            code
        }
    }, { status });
}

export function createErrorResponse(message: string, code: ErrorCode): ErrorServerActionResult {
    return {
        success: false,
        data: null,
        error: {
            message,
            code
        }
    };
}

export function responseWithData<T>(data: T) {
    return NextResponse.json<SuccessServerActionResult<T>>({
        success: true,
        data,
        error: null
    });
}

export function createSuccessResponse<T>(data: T): SuccessServerActionResult<T> {
    return {
        success: true,
        data,
        error: null
    };
}
