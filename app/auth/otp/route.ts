import { AuthUtils } from "@/components/AuthUtils";
import sequelize from "@/components/database/db";
import { User } from "@/components/database/dbTypes";
import { ErrorUtils } from "@/components/ErrorUtils";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const res_lgc = await AuthUtils.checkLogin(request, ["otp"]);
    if (res_lgc instanceof Response) {
        return res_lgc;
    }

    if (!res_lgc.username) return ResponseUtils.badToken("No aud claim.");
    const user_name = res_lgc.username;

    let res;
    try {
        res = await User.findOne({
            attributes: ["id", "ref_tokens"],
            where: { username: user_name }
        });
    } catch (e) {
        ErrorUtils.log(e as Error);
        return ResponseUtils.serverError("Database Error");
    }

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

    try {
        await sequelize.transaction(async (t) => {
            await User.update({
                ref_tokens: res.ref_tokens
            }, {
                where: {
                    id: res.id
                },
                transaction: t
            });
        });
    } catch (e) {
        ErrorUtils.log(e as Error);
        return ResponseUtils.serverError("Database Error");
    }

    return ResponseUtils.successJson({
        url: process.env.WEBSITE_URL + "/auth/otp?"
            + "state=" + state
            + "&username=" + user_name
            + "&code=" + otp_code
    });
}