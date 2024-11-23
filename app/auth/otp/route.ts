import { jaw_db } from "@/app/Db";
import { AuthUtils } from "@/components/AuthUtils";
import { ResponseUtils } from "@/components/ResponseUtils";
import { sql } from "@vercel/postgres";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const res_lgc = await AuthUtils.checkLogin(request);
    if (res_lgc instanceof Response) {
        return res_lgc;
    }

    if (!res_lgc.username) return ResponseUtils.badToken("No aud claim.");
    const user_name = res_lgc.username;

    let res = await jaw_db
        .selectFrom("users")
        .select(["id", "ref_tokens"])
        .where("username", "=", user_name)
        .executeTakeFirst();
    if (!res) {
        return ResponseUtils.bad("User: not exists");
    }

    res.ref_tokens = AuthUtils.removeExpireRefTokensFrom(res.ref_tokens);
    let counter = 0;
    for (let i in res.ref_tokens) {
        if (!res.ref_tokens[i].ref_token) counter++;
    }
    if (counter > 3) {
        return ResponseUtils.bad("Request. Too many login requests. Please wait a while.")
    }


    const state = AuthUtils.generateState(res.ref_tokens);
    let exp_time = new Date();
    exp_time.setMinutes(exp_time.getMinutes() + 1);

    const otp_code = "OTPC" + AuthUtils.generateRandomString(96);
    res.ref_tokens.push({
        state_c: state,
        ref_token: null,
        exp_time: exp_time,
        desc_c: "THIS IS FOR OPT CODE LOGIN",
        scope: null,
        otp_code: otp_code
    });

    await sql`
        UPDATE users
        SET ref_tokens = ${JSON.stringify(res.ref_tokens)}
        WHERE id = ${res.id}
    `;

    return ResponseUtils.successJson({
        url: process.env.WEBSITE_URL + "/auth/otp?"
            + "state=" + state
            + "&username=" + user_name
            + "&code=" + otp_code
    });
}