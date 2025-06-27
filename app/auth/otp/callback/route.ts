import { AuthUtils } from "@/components/AuthUtils";
import sequelize from "@/components/database/db";
import { User } from "@/components/database/dbTypes";
import { ErrorHandler } from "@/components/ErrorHandler";
import { ResponseUtils } from "@/components/ResponseUtils";
import { userAgent } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const username = searchParams.get('username');

    const r = ErrorHandler.checkParameter({ code: code, state: state, username: username });
    if (r) return r;

    let res;
    try {
        res = await User.findOne({
            attributes: ["ref_tokens"],
            where: { username: username }
        });
    } catch (e) {
        return ErrorHandler.databaseError();
    }

    if (!res) return ErrorHandler.userNotExists();

    res.ref_tokens = AuthUtils.removeExpireRefTokensFrom(res.ref_tokens);

    let link = null;
    res.ref_tokens.forEach((v, k) => {
        if (v.state_c == state && v.ref_token == null && v.otp_code == code) {
            link = k;
        }
    })
    if (link == null) return ErrorHandler.stateNotExists();
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

    try {
        await sequelize.transaction(async (t) => {
            await User.update({
                ref_tokens: res.ref_tokens
            }, {
                where: {
                    username: username
                },
                transaction: t
            });
        });
    } catch (e) {
        return ErrorHandler.databaseError();
    }

    let jwt;
    try {
        jwt = await AuthUtils.getJwt(username!, ["website", "api"]);
    } catch (e) {
        return ErrorHandler.databaseError();
    }

    return ResponseUtils.successJson({ jwt: jwt, ref_token: ref_token, username: username, client_id: desc_c });
}