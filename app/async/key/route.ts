import { jaw_db, MusicDataType } from "@/app/Db";
import { AuthUtils } from "@/components/AuthUtils";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    if (!res.username) return ResponseUtils.badToken("No aud claim.");
    const key = await jaw_db
        .selectFrom("users")
        .select("async_key")
        .where("username", "=", res.username)
        .executeTakeFirst();

    if (!key) return ResponseUtils.bad("Username. User not found.");

    return ResponseUtils.successJson({async_key: key.async_key});
}