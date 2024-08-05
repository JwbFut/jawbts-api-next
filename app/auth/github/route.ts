import { jaw_db } from "@/app/Db";
import { AuthUtils } from "@/components/AuthUtils";
import { ResponseUtils } from "@/components/ResponseUtils";
import { sql } from "@vercel/postgres";
import { userAgent } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const user_name = searchParams.get('user_name');

    if (user_name === null) return ResponseUtils.missing("param: user_name");

    let res = await jaw_db
        .selectFrom("users")
        .select(["id", "ref_tokens"])
        .where("username", "=", user_name)
        .executeTakeFirst();
    if (!res) {
        return ResponseUtils.bad("User: not exists");
    }

    let counter = 0;
    for (let i in res.ref_tokens) {
        if (!res.ref_tokens[i].ref_token) counter++;
    }
    if (counter > 3) {
        return ResponseUtils.bad("Request. Too many login requests. Please wait a while.")
    }


    const state = AuthUtils.generateState();
    const { browser, os } = userAgent(request);
    let exp_time = new Date();
    exp_time.setMinutes(exp_time.getMinutes() + 1);
    res.ref_tokens.push({
        state_c: state,
        ref_token: null,
        exp_time: exp_time,
        desc_c: (os.name ? os.name : "Unknown")
            + "-" + (browser.name ? browser.name : "Unknown")
            + "-" + AuthUtils.generateRandomString(5),
        scope: null
    });
    res.ref_tokens = AuthUtils.removeExpireRefTokensFrom(res.ref_tokens);

    await sql`
        UPDATE users
        SET ref_tokens = ${JSON.stringify(res.ref_tokens)}
        WHERE id = ${res.id}
    `;

    return ResponseUtils.successJson({
        url: 'https://github.com/login/oauth/authorize?'
            + 'client_id=' + process.env.GITHUB_CLIENT_ID + '&'
            + 'redirect_uri=' + process.env.WEBSITE_URL + '/auth/github/callback' + '&'
            + 'scope=(no scope)&state=' + state
    });
}