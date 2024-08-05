import { AuthUtils } from "@/components/AuthUtils";
import { ResponseUtils } from "@/components/ResponseUtils";
import { jaw_db } from "../Db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    if (!res.username) {
        return ResponseUtils.badToken("No aud claim.");
    }

    let db_res = await jaw_db
        .selectFrom("users")
        .select(["id", "username", "avatar_url", "description", "ref_tokens"])
        .where("username", "=", res.username)
        .executeTakeFirst();
    if (!db_res) {
        return ResponseUtils.badToken("User not exists.");
    }
    
    db_res.ref_tokens = db_res.ref_tokens.filter((reftoken) => {
        if (reftoken.ref_token) return true;
        return false;
    })
    for (let i in db_res.ref_tokens) {
        db_res.ref_tokens[i].ref_token = null;
    }

    return ResponseUtils.successJson(db_res);
}