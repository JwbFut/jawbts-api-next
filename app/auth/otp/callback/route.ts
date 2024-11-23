import { jaw_db } from "@/app/Db";
import { AuthUtils } from "@/components/AuthUtils";
import { ResponseUtils } from "@/components/ResponseUtils";
import { db } from "@vercel/postgres";
import { userAgent } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const username = searchParams.get('username');

    if (!code || !state || !username) return ResponseUtils.missing("params: code / state / username");

    const res = await jaw_db
        .selectFrom("users")
        .select("ref_tokens")
        .where("username", "=", username)
        .executeTakeFirst();
    if (!res) return ResponseUtils.bad("Account: Account Not Exists");

    res.ref_tokens = AuthUtils.removeExpireRefTokensFrom(res.ref_tokens);

    let link = null;
    res.ref_tokens.forEach((v, k) => {
        if (v.state_c == state && v.ref_token == null && v.otp_code == code) {
            link = k;
        }
    })
    if (link == null) return ResponseUtils.bad("State: State Not Exists (maybe expired)");
    res.ref_tokens = res.ref_tokens.filter((v) => {
        return v.state_c != state;
    });

    const { browser, os } = userAgent(request);
    const expire_date = new Date();
    expire_date.setMonth(expire_date.getMonth() + 6);
    const ref_token = AuthUtils.generateToken();
    const desc_c = (os.name ? os.name : "Unknown")
        + "-" + (browser.name ? browser.name : "Unknown")
        + "-" + AuthUtils.generateRandomString(5);

    res.ref_tokens.push({
        state_c: state,
        ref_token: await AuthUtils.hash(ref_token + username, ""),
        exp_time: expire_date,
        desc_c: desc_c,
        scope: ["website", "api"],
        otp_code: null
    });

    // 这是玄学 不要乱换行
    let client = await db.connect();
    await client.query(`UPDATE users SET ref_tokens = '${JSON.stringify(res.ref_tokens)}' WHERE username = '${username}';`);

    return ResponseUtils.successJson({ jwt: await AuthUtils.getJwt(username, ["website", "api"]), ref_token: ref_token, username: username, client_id: desc_c });
}