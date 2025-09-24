import { ErrorCode } from "@/enums/error";
import { ErrorServerActionResult } from "@/types/actions";

/**
 * Predicable errors for application
 */
export class AppError extends Error {
    code: ErrorCode;
    constructor(message: string, code?: ErrorCode) {
        super(message);
        this.name = "AppError";
        this.code = code || ErrorCode.UNKNOWN;
    }
}

export class AppValidationError extends AppError {
    constructor(message: string) {
        super(message);
        this.name = "AppValidationError";
    }
}

export class PrecheckError extends AppError {
    constructor(message: string, code?: ErrorCode) {
        super(message);
        this.name = "PrecheckError";
        this.code = code || ErrorCode.FORBIDDEN;
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
