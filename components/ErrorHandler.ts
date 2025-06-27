import { ResponseUtils } from "./ResponseUtils";

/**
 * error code list:
 * 10000: Not Found
 * 10001: token expired
 * 10002: invalid token
 * 10003: need login
 * 10004: internal server error
 * 10005: user not exists
 * 10006: missing parameter
 * 10007: state not exists
 * 10008: rate limit exceeded
 * 10009: unknown error
 * 10010: invalid form data
 * 10011: verify code expired
 * 10012: verify code invalid
 */

export class ErrorHandler {
    static notFound() {
        return ResponseUtils.json("Failed", { reason: "Not Found", code: 10000 }, 404, "Not Found");
    }

    static _badToken(reason: string, code: number) {
        return ResponseUtils.jsonWithHeaders("Failed", { reason: "Bad Token: " + reason, code: code }, 400, "Bad Token", new Headers([["WWW-Authenticate", "Bearer realm=\"Access to the staging site\""]]));
    }

    static tokenExpired() {
        return this._badToken("Token expired", 10001);
    }
    static invalidToken() {
        return this._badToken("Invalid token", 10002);
    }

    static needLogin() {
        return ResponseUtils.jsonWithHeaders("Failed", { reason: "Unauthorized", code: 10003 }, 401, "Unauthorized", new Headers([["WWW-Authenticate", "Bearer realm=\"Access to the staging site\""]]));
    }

    static internalServerError(message: string) {
        return ResponseUtils.json("Failed", { reason: `Internal Server Error (${message})`, code: 10004, solution: "1.Try again later. 2.Tell the admin what happened." }, 500, "Internal Server Error");
    }

    static databaseError() {
        return this.internalServerError("Database Error");
    }

    static dataFetchError() {
        return this.internalServerError("Data Fetch Error");
    }

    static userNotExists() {
        return ResponseUtils.json("Failed", { reason: "User not exists", code: 10005 }, 400, "Bad Request");
    }

    static missingParameter(parameter: string[]) {
        return ResponseUtils.json("Failed", { reason: `Missing parameter: ${parameter}`, code: 10006 }, 400, "Bad Request");
    }

    /**
     * example usage:
     * const r = ErrorHandler.checkParameter({ name: "John", age: null });
     * if (r) return r;
     */
    static checkParameter<T extends Record<string, string | null>>(parameter: T) {
        const missing = Object.keys(parameter).filter(key => parameter[key] === null);
        if (missing.length > 0) {
            return this.missingParameter(missing);
        }
        return null;
    }

    static stateNotExists() {
        return ResponseUtils.json("Failed", { reason: "State not exists", code: 10007 }, 400, "Bad Request");
    }

    static rateLimitExceeded() {
        return ResponseUtils.json("Failed", { reason: "Rate limit exceeded", code: 10008 }, 429, "Too Many Requests");
    }

    static unknownError() {
        return ResponseUtils.json("Failed", { reason: "Unknown error", code: 10009 }, 500, "Internal Server Error");
    }

    static invalidFormData() {
        return ResponseUtils.json("Failed", { reason: "Invalid form data", code: 10010 }, 400, "Bad Request");
    }

    static failedToSendEmail() {
        return this.internalServerError("Failed to send email");
    }

    static verifyCodeExpired() {
        return ResponseUtils.json("Failed", { reason: "Verify code expired", code: 10011 }, 400, "Bad Request");
    }

    static verifyCodeInvalid() {
        return ResponseUtils.json("Failed", { reason: "Verify code invalid", code: 10012 }, 400, "Bad Request");
    }
}