import { AuthUtils } from "@/components/AuthUtils";
import sequelize from "@/components/database/db";
import { User } from "@/components/database/dbTypes";
import { ErrorUtils } from "@/components/ErrorUtils";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    const { searchParams } = new URL(request.url);
    if (res instanceof Response) {
        return res;
    }

    if (!res.username) return ResponseUtils.badToken("No aud claim.");
    let desc = searchParams.get("desc_c");
    if (!desc) return ResponseUtils.missing("param desc_c.");

    let res_db;
    try {
        res_db = await User.findOne({
            attributes: ["ref_tokens"],
            where: {
                username: res.username
            }
        });
    } catch (e) {
        ErrorUtils.log(e as Error);
        return ResponseUtils.serverError("Database Error");
    }

    if (!res_db) {
        return ResponseUtils.badToken("User not exists.");
    }

    let k = res_db.ref_tokens.find((token) => {
        return token.desc_c == desc;
    });
    // 你要吊销, 但是这个token已经没了, 那么也算成功了
    if (k == undefined) return ResponseUtils.success();

    try {
        await sequelize.transaction(async (t) => {
            await User.update({
                ref_tokens: sequelize.fn("array_remove", sequelize.col("ref_tokens"), k)
            }, {
                where: {
                    username: res.username
                },
                transaction: t
            });
        });
    } catch (e) {
        ErrorUtils.log(e as Error);
        return ResponseUtils.serverError("Database Error");
    }

    return ResponseUtils.success();
}