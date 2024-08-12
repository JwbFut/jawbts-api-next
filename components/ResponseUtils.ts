export class ResponseUtils {
    static successJson(json: any) {
        return Response.json({ code: 'Success', data: json }, { headers: {"Content-Type": "application/json; charset=utf-8"} });
    }

    /**
     * 
     * @param json (reason)
     * @returns 
     */
    static notFound(json: any) {
        return this.json("Failed", json, 404, "Not Found");
    }

    /**
     * 
     * @param obj Missing what?
     * @returns 
     */
    static missing(obj: string) {
        return this.json("Failed", { reason: "Missing " + obj }, 400, "Missing " + obj);
    }

    /**
     * 
     * @param obj Wrong what?
     * @returns 
     */
    static wrong(obj: string) {
        return this.json("Failed", { reason: "Wrong " + obj }, 400, "Wrong " + obj);
    }

    /**
     * 
     * @param obj bad what?
     * @returns
     */
    static bad(obj: string) {
        return this.json("Failed", { reason: "Bad " + obj }, 400, "Bad " + obj);
    }

    static serverError(message: string) {
        return this.json("Failed",
        { reason: "Internal Server Error (" + message + ")", solution: "1.Try again later. 2.Tell the admin what happened." },
        500, "Internal Server Error");
    }

    static needLogin() {
        let headers = new Headers();
        headers.append("WWW-Authenticate", "customscheme realm=\"Access to the staging site\"");
        return this.jsonWithHeaders("Failed", { reason: "Unauthorized" }, 401, "Unauthorized", headers);
    }

    static badToken(reason: string) {
        let headers = new Headers();
        headers.append("WWW-Authenticate", "customscheme realm=\"Access to the staging site\"");
        return this.jsonWithHeaders("Failed", { reason: "Bad Token: " + reason }, 400, "Bad Token", headers);
    }

    static json(code: string, json: any, status: number, statusText: string) {
        const blob = new Blob([JSON.stringify({ code: code, data: json }, null, 2)]);
        return new Response(blob, { status: status, statusText: statusText,
                headers: {"Content-Type": "application/json; charset=utf-8"}
            });
    }

    static jsonWithHeaders(code: string, json: any, status: number, statusText: string, headers: Headers) {
        const blob = new Blob([JSON.stringify({ code: code, data: json }, null, 2)], {
            type: "application/json",
        });
        return new Response(blob, { status: status, statusText: statusText, headers: headers})
    }

    static success() {
        const blob = new Blob([JSON.stringify({ code: "Success" }, null, 2)], {
            type: "application/json",
        });
        return new Response(blob, { status: 200, statusText: "OK",})
    }
}