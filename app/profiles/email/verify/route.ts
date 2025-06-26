import { AuthUtils } from "@/components/AuthUtils";
import sequelize from "@/components/database/db";
import { User } from "@/components/database/dbTypes";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    const { searchParams } = new URL(request.url);
    const verify_code = searchParams.get("verify_code");

    if (!verify_code) {
        return ResponseUtils.missing("verify_code");
    }

    let t;
    try {
        t = await sequelize.transaction();

        const user = await User.findOne({
            attributes: ["email"],
            where: { username: res.username },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        if (!user) {
            await t.rollback();
            return ResponseUtils.userNotExisis();
        }

        if (user.email.verified) {
            await t.rollback();
            return ResponseUtils.success();
        }

        if (user.email.verify_code === verify_code) {
            if (Date.now() > new Date(user.email.verify_exp_time).getTime()) {
                await t.rollback();
                return ResponseUtils.bad("verify_code. Expired.");
            }

            user.email.verified = true;
            await User.update(
                { email: user.email },
                { where: { username: res.username }, transaction: t },
            );
            await t.commit();
            return ResponseUtils.success();
        }

        await t.rollback();
        return ResponseUtils.wrong("verify_code");
    } catch (e) {
        if (t) await t.rollback();
        throw e;
    }
}