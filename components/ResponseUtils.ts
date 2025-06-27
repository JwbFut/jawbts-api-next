export class ResponseUtils {
    static successJson(json: any) {
        return Response.json({ code: 'Success', data: json }, { headers: { "Content-Type": "application/json; charset=utf-8" } });
    }

    static json(code: string, json: any, status: number, statusText: string) {
        const blob = new Blob([JSON.stringify({ code: code, data: json }, null, 2)]);
        return new Response(blob, {
            status: status, statusText: statusText,
            headers: { "Content-Type": "application/json; charset=utf-8" }
        });
    }

    static jsonWithHeaders(code: string, json: any, status: number, statusText: string, headers: Headers) {
        const blob = new Blob([JSON.stringify({ code: code, data: json }, null, 2)], {
            type: "application/json",
        });
        headers.set("Content-Type", "application/json; charset=utf-8");
        return new Response(blob, { status: status, statusText: statusText, headers: headers })
    }

    static success() {
        const blob = new Blob([JSON.stringify({ code: "Success" }, null, 2)], {
            type: "application/json",
        });
        return new Response(blob, { status: 200, statusText: "OK", })
    }
}