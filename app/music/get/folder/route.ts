import { AuthUtils } from "@/components/AuthUtils";
import { ErrorUtils } from "@/components/ErrorUtils";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const login = await AuthUtils.checkLogin(request);
    if (login instanceof Response) return login;
    
    const mid = searchParams.get('up_mid');
    if (!mid) return ResponseUtils.missing("Param: up_mid");

    let response_js;
    try {
        response_js = JSON.parse(await fetch('http://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=' + mid)
        .then(response => response.text())).data.list;
    } catch(e) {
        if ((e as Error).message == "Cannot read properties of undefined (reading 'list')") {
            return ResponseUtils.bad("up_mid");
        }
        ErrorUtils.log(e as Error);
        return ResponseUtils.serverError("Unknown");
    }
    
    return ResponseUtils.successJson(response_js);
}