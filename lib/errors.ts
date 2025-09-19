import { ErrorCode } from "@/enums/error";
import { ErrorServerActionResult } from "@/types/actions";

/**
 * @deprecated
 */
export class AppError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AppError";
    }
}

export class ServerActionError extends Error {
    code: ErrorCode;
    constructor(error: ErrorServerActionResult["error"]) {
        super(error.message);
        this.name = "ServerActionError";
        this.code = error.code;
    }
}