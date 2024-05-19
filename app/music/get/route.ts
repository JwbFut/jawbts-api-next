import { AuthUtils } from "@/components/AuthUtils";
import { ErrorUtils } from "@/components/ErrorUtils";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const login = await AuthUtils.checkLogin(request);
    if (login instanceof Response) return login;
    
    const bv = searchParams.get('bv');
    if (!bv) return ResponseUtils.missing("Param: bv");

    const response = await fetch('https://www.bilibili.com/video/' + bv + '/');
    const text = await response.text();
    const res = text.match(/<script>window.__playinfo__=(.*?)<\/script>/)
    if (!res || ! res[1]) return ResponseUtils.bad("Website: No Playinfo");
    const res_js = JSON.parse(res[1]);
    const audio_url = res_js['data']['dash']['audio'][0]['base_url'];

    let headers = request.headers;
    headers.set('Referer', 'https://bilibili.com');
    headers.set('Origin', 'https://bilibili.com/');
    headers.set('Authorization', '');

    let response_music;

    try {
        response_music = await fetch(audio_url, {
            headers: headers
        });
    } catch(e) {
        ErrorUtils.log(e as Error);
        return ResponseUtils.serverError("Unknown");
    }

    return response_music;
}