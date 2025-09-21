import { ErrorCode } from "@/enums/error";
import { IMonthPresence } from "./month-presence";

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

export type SuccessPrecheckResult<T> = [data: T, error: null];

export type ErrorPrecheckResult = [data: null, error: ActionError]

export type PrecheckResponse<T> = Promise<SuccessPrecheckResult<T> | ErrorPrecheckResult>;
export type PrecheckSyncResponse<T> = SuccessPrecheckResult<T> | ErrorPrecheckResult;

export interface MarkPresenceBody {
    /**
     * Month in the format of YYYY-MM
     */
    month: string;
    /**
     * 0-based day of the month
     */
    day: number;
    status: IMonthPresence["presence"][0];
    roomId: string;
}
