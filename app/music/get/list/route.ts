import { jaw_db } from "@/app/Db";
import { AuthUtils } from "@/components/AuthUtils";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    if (!res.username) return ResponseUtils.badToken("No aud claim.");

    const musics = await jaw_db
        .selectFrom("users")
        .select("music_data")
        .where("username", "=", res.username)
        .executeTakeFirst();

    if (!musics) return ResponseUtils.bad("Username. User not found.");

    return ResponseUtils.successJson(musics.music_data);
}