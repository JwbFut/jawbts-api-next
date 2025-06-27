import { AuthUtils } from "@/components/AuthUtils";
import sequelize from "@/components/database/db";
import { User } from "@/components/database/dbTypes";
import { ErrorHandler } from "@/components/ErrorHandler";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    const { searchParams } = new URL(request.url);
    if (res instanceof Response) {
        return res;
    }

    let desc_c = searchParams.get("desc_c");
    const r = ErrorHandler.checkParameter({ desc_c: desc_c });
    if (r) return r;

    let t;
    try {
        t = await sequelize.transaction();

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
            await t.rollback();
            return ErrorHandler.databaseError();
        }

        if (!res_db) {
            await t.rollback();
            return ErrorHandler.userNotExists();
        }

        let k = res_db.ref_tokens.findIndex((token) => {
            return token.desc_c == desc_c;
        });
        // 你要吊销, 但是这个token已经没了, 那么也算成功了
        if (k == -1) {
            await t.commit();
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
            await t.commit();
        } catch (e) {
            await t.rollback();
            return ErrorHandler.databaseError();
        }

        return ResponseUtils.success();
    } catch (e) {
        if (t) await t.rollback();
        return ErrorHandler.unknownError();
    }
}