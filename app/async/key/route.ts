import { AuthUtils } from "@/components/AuthUtils";
import { User } from "@/components/database/dbTypes";
import { ErrorHandler } from "@/components/ErrorHandler";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    let key;
    try {
        key = await User.findOne({
            attributes: ["async_key"],
            where: { username: res.username },
        });
    } catch (e) {
        return ErrorHandler.databaseError();
    }

    if (!key) return ErrorHandler.userNotExists();

    return ResponseUtils.successJson({ async_key: key.async_key });
}