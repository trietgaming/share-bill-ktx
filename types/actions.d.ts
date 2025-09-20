import { ErrorCode } from "@/enums/error";

export interface ActionError {
    message: string;
    code: ErrorCode;
}

export interface SuccessServerActionResult<T> {
    success: true;
    data: T;
    error: null;
}

export interface ErrorServerActionResult {
    success: false;
    data: null;
    error: ActionError;
}

export type ServerActionResponse<T> = Promise<(SuccessServerActionResult<T> | ErrorServerActionResult)> 
