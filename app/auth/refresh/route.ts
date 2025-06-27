import { AuthUtils } from "@/components/AuthUtils";
import { User } from "@/components/database/dbTypes";
import { ErrorHandler } from "@/components/ErrorHandler";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ref_token = searchParams.get('ref_token');
    const user_name = searchParams.get('user_name');

    const r = ErrorHandler.checkParameter({ ref_token: ref_token, user_name: user_name });
    if (r) return r;

    let res;
    try {
        res = await User.findOne({
            attributes: ["ref_tokens"],
            where: { username: user_name }
        });
    } catch (e) {
        return ErrorHandler.databaseError();
    }

    if (!res) return ErrorHandler.userNotExists();

    let real_ref = null;
    const decoded_token = decodeURIComponent(ref_token!);
    for (let i in res.ref_tokens) {
        if (res.ref_tokens[i].ref_token == decoded_token) {
            real_ref = res.ref_tokens[i];
        }
    }

    if (!real_ref) return ErrorHandler.invalidToken();

    if (real_ref.exp_time === null) return ErrorHandler.unknownError();

    if (real_ref.exp_time < new Date()) return ErrorHandler.tokenExpired();

    return ResponseUtils.successJson({ jwt: await AuthUtils.getJwt(user_name!, real_ref.scope ? real_ref.scope : []), username: user_name });
}