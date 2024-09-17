import { AuthUtils } from "@/components/AuthUtils";
import { ErrorUtils } from "@/components/ErrorUtils";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")
    if (!token) return ResponseUtils.needLogin();
    const login = await AuthUtils.checkToken(token);
    if (login instanceof Response) return login;

    const id = searchParams.get('id');
    if (!id) return ResponseUtils.missing("Param: id");

    if (id.startsWith("B")) {
        let headers = request.headers;
        headers.delete('Authorization');

        const id_r = id.slice(1).split("_");
        try {
            // 注意, 缓存1天
            const response = await fetch("https://api.bilibili.com/x/web-interface/view?bvid=" + id_r[0], { next: { revalidate: 86400 } });
            const json = await response.json();

            let title = json.data.title;
            if (id_r.length > 1) {
                const page = json.data.pages[parseInt(id_r[1]) - 1];
                if (page.part != title) {
                    title += "/" + page.part;
                }
            }

            return ResponseUtils.successJson({
                title: title,
                author: json.data.owner.name,
                cover: json.data.pic
            })
        } catch (e) {
            ErrorUtils.log(e as Error);
            return ResponseUtils.serverError((e as Error).message);
        }
    } else {
        return ResponseUtils.bad("id");
    }
}