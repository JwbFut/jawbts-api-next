import { AuthUtils } from "@/components/AuthUtils";
import { User } from "@/components/database/dbTypes";
import { ErrorUtils } from "@/components/ErrorUtils";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    if (!res.username) return ResponseUtils.badToken("No aud claim.");
    let key;
    try {
        key = await User.findOne({
            attributes: ["async_key"],
            where: { username: res.username },
        });
    } catch (e) {
        ErrorUtils.log(e as Error);
        return ResponseUtils.serverError("Database Error");
    }

    if (!key) return ResponseUtils.bad("Username. User not found.");

    return ResponseUtils.successJson({ async_key: key.async_key });
}