import { AuthUtils } from "@/components/AuthUtils";
import { User } from "@/components/database/dbTypes";
import { ErrorHandler } from "@/components/ErrorHandler";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    let db_res;
    try {
        db_res = await User.findOne({
            attributes: ["id", "username", "avatar_url", "description", "ref_tokens"],
            where: { username: res.username }
        });
    } catch (e) {
        return ErrorHandler.databaseError();
    }

    if (!db_res) {
        return ErrorHandler.userNotExists();
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