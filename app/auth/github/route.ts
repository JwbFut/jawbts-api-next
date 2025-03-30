import { AuthUtils } from "@/components/AuthUtils";
import sequelize from "@/components/database/db";
import { User } from "@/components/database/dbTypes";
import { ErrorUtils } from "@/components/ErrorUtils";
import { ResponseUtils } from "@/components/ResponseUtils";
import { userAgent } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const user_name = searchParams.get('user_name');

    if (user_name === null) return ResponseUtils.missing("param: user_name");

    let res;
    try {
        res = await User.findOne({
            attributes: ["id", "ref_tokens"],
            where: {
                username: user_name
            }
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
        scope: null,
        otp_code: null
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
        url: 'https://github.com/login/oauth/authorize?'
            + 'client_id=' + process.env.GITHUB_CLIENT_ID + '&'
            + 'redirect_uri=' + process.env.WEBSITE_URL + '/auth/github/callback' + '&'
            + 'scope=(no scope)&state=' + state
    });
}