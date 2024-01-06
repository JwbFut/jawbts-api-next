export class ResponseUtils {
    static successJson(json: any) {
        return Response.json({code: 'Success', data: json});
    }
}