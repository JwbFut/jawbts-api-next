

export class ResponseUtils {
    static successJson(json: any) {
        return Response.json({ code: 'Success', data: json }, { headers: {"Content-Type": "application/json; charset=utf-8"} });
    }
    static notFound(json: any) {
        return this.json("Failed", json, 404, "Not Found");
    }
    static json(code: string, json: any, status: number, statusText: string) {
        const blob = new Blob([JSON.stringify({ code: code, data: json }, null, 2)]);
        return new Response(blob, { status: status, statusText: statusText,
                headers: {"Content-Type": "application/json; charset=utf-8"}
            });
    }
}