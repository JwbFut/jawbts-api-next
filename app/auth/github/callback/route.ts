import { AuthUtils } from "@/components/AuthUtils";
import sequelize from "@/components/database/db";
import { User } from "@/components/database/dbTypes";
import { ErrorUtils } from "@/components/ErrorUtils";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) return ResponseUtils.missing("params: code / state");

    let data = null;
    try {
        data = await fetch('https://github.com/login/oauth/access_token?' +
            'client_id=' + process.env.GITHUB_CLIENT_ID + '&' +
            'client_secret=' + process.env.GITHUB_CLIENT_SECRET + '&' +
            'code=' + code, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });
        data = await data.json();
    } catch (e) {
        ErrorUtils.log(e as Error);
    }

    if (data == null) {
        return ResponseUtils.serverError("Server Network Error");
    }

    const access_token = data.access_token;
    if (access_token == null) {
        return ResponseUtils.badToken("(Maybe Expired)");
    }

    if (data.token_type != "bearer") {
        return ResponseUtils.badToken("Wrong Token Type");
    }

    data = null;
    try {
        data = await fetch('https://api.github.com/user', {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": "Bearer " + access_token
            }
        });
        data = await data.json();
    } catch (e) {
        ErrorUtils.log(e as Error);
    }

    if (data == null) {
        return ResponseUtils.serverError("Server Network Error");
    }

    if (data.id == null) {
        return ResponseUtils.serverError("data.id Does Not Exist")
    }

    let res;
    try {
        res = await User.findOne({
            attributes: ["username", "ref_tokens"],
            where: {
                id: data.id
            }
        });
    } catch (e) {
        ErrorUtils.log(e as Error);
        return ResponseUtils.serverError("Database Error");
    }

    if (!res) return ResponseUtils.bad("Account: Account Not Exists");

    res.ref_tokens = AuthUtils.removeExpireRefTokensFrom(res.ref_tokens);

    let link = null;
    res.ref_tokens.forEach((v, k) => {
        if (v.state_c == state && v.ref_token == null) {
            link = k;
        }
    })
    if (link == null) return ResponseUtils.bad("State: State Not Exists (maybe expired)");

    const ref_token = AuthUtils.generateToken();
    const expire_date = new Date();
    expire_date.setMonth(expire_date.getMonth() + 6);
    res.ref_tokens[link].exp_time = expire_date;
    res.ref_tokens[link].ref_token = await AuthUtils.hash(ref_token + res.username, "");
    res.ref_tokens[link].scope = ["website", "api", "otp"];

    try {
        await sequelize.transaction(async (t) => {
            await User.update({
                ref_tokens: res.ref_tokens
            }, {
                where: {
                    id: data.id
                },
                transaction: t
            });
        });
    } catch (e) {
        ErrorUtils.log(e as Error);
        return ResponseUtils.serverError("Database Error");
    }

    let jwt;
    try {
        jwt = await AuthUtils.getJwt(res.username, ["website", "api", "otp"]);
    } catch (e) {
        ErrorUtils.log(e as Error);
        return ResponseUtils.serverError("Database Error");
    }

    return ResponseUtils.successJson({ jwt: jwt, ref_token: ref_token, username: res.username, client_id: res.ref_tokens[link].desc_c });
}