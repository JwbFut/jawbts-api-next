import { jaw_db } from "@/app/Db";
import { AuthUtils } from "@/components/AuthUtils";
import { ResponseUtils } from "@/components/ResponseUtils";
import { db, sql } from "@vercel/postgres";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    const { searchParams } = new URL(request.url);
    if (res instanceof Response) {
        return res;
    }

    if (!res.username) return ResponseUtils.badToken("No aud claim.");
    let desc = searchParams.get("desc_c");
    if (!desc) return ResponseUtils.missing("param desc_c.");

    let res_db = await jaw_db
        .selectFrom("users")
        .select("ref_tokens")
        .where("username", "=", res.username)
        .executeTakeFirst();

    if (!res_db) {
        return ResponseUtils.badToken("User not exists.");
    }

    let k = res_db.ref_tokens.findIndex((token) => {
        return token.desc_c == desc;
    });
    // 你要吊销, 但是这个token已经没了, 那么也算成功了
    if (k < 0) return ResponseUtils.success();

    let client = await db.connect();
    await client.query(`UPDATE users SET ref_tokens = ref_tokens - ${k} WHERE username = '${res.username.toString()}';`);

    return ResponseUtils.success();
}