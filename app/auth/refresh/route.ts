import { jaw_db } from "@/app/Db";
import { AuthUtils } from "@/components/AuthUtils";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const refresh_token = searchParams.get('ref_token');
    const username = searchParams.get('user_name');

    if (!refresh_token || !username) return ResponseUtils.missing("params: ref_token / user_name");

    const res = await jaw_db
        .selectFrom("users")
        .select("ref_tokens")
        .where("username", "=", username)
        .executeTakeFirst();

    if (!res) return ResponseUtils.bad("username.");

    let real_ref = null;
    const decoded_token = decodeURIComponent(refresh_token);
    for (let i in res.ref_tokens) {
        if (res.ref_tokens[i].ref_token == decoded_token) {
            real_ref = res.ref_tokens[i];
        }
    }

    if (!real_ref) return ResponseUtils.bad("refresh token.")

    if (real_ref.exp_time === null) return ResponseUtils.serverError("Database error. Shound't happen. Please report & login again.");

    if (real_ref.exp_time < new Date()) return ResponseUtils.bad("Refresh token. Expired.");

    return ResponseUtils.successJson({jwt: await AuthUtils.getJwt(username, real_ref.scope ? real_ref.scope : []), username: username});
}