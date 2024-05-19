import { AuthUtils } from "@/components/AuthUtils";
import { ResponseUtils } from "@/components/ResponseUtils";
import { sql } from "@vercel/postgres";

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    const { searchParams } = new URL(request.url);
    const des = searchParams.get("description");
    const avatar_url = searchParams.get("avatar_url");
    const bilibili_music_folder = searchParams.get("bilibili_music_folder");

    if (des) {
        sql`UPDATE users
            SET description = ${des}
            WHERE id = ${res.id}`;
    }
    if (avatar_url) {
        sql`UPDATE users
            SET avatar_url = ${avatar_url}
            WHERE id = ${res.id}`;
    }
    if (bilibili_music_folder) {
        sql`UPDATE users
            SET bilibili_music_folder = ${bilibili_music_folder}
            WHERE id = ${res.id}`;
    }

    return ResponseUtils.success();
}