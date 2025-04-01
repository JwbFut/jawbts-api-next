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

    const t = await sequelize.transaction();

    let res_db;
    try {
        res_db = await User.findOne({
            attributes: ["ref_tokens"],
            where: {
                username: res.username
            },
            lock: t.LOCK.UPDATE,
            transaction: t
        });
    } catch (e) {
        ErrorUtils.log(e as Error);
        t.rollback();
        return ResponseUtils.serverError("Database Error");
    }

    if (!res_db) {
        t.rollback();
        return ResponseUtils.badToken("User not exists.");
    }

    let k = res_db.ref_tokens.findIndex((token) => {
        return token.desc_c == desc;
    });
    // 你要吊销, 但是这个token已经没了, 那么也算成功了
    if (k == -1) {
        t.commit();
        return ResponseUtils.success();
    }

    try {
        await User.update({
            ref_tokens: sequelize.literal(`ref_tokens #- '{${k}}'`)
        }, {
            where: {
                username: res.username
            },
            transaction: t
        });
        t.commit();
    } catch (e) {
        ErrorUtils.log(e as Error);
        t.rollback();
        return ResponseUtils.serverError("Database Error");
    }

    return ResponseUtils.success();
}