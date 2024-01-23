

export class ResponseUtils {
    static successJson(json: any) {
        return Response.json({ code: 'Success', data: json });
    }
    static notFound(json: any) {
        return this.json("Failed", json, 404, "Not Found");
    }
    static json(code: string, json: any, status: number, statusText: string) {
        const blob = new Blob([JSON.stringify({ code: code, data: json }, null, 2)], {
            type: "application/json",
        });
        return new Response(blob, { status: status, statusText: statusText})
    }
}