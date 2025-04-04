import sequelize from "@/components/database/db";
import { Op, Transaction } from "sequelize";
import { Jwk } from "@/components/database/dbTypes";
import { AuthUtils } from "./AuthUtils";
import { ErrorUtils } from "./ErrorUtils";

export async function do_every_monday() {
    // 每周一执行 这个不用了, 因为改成vercel的定时任务了
    // schedule.scheduleJob('0 0 0 * * 1', async () => {
    //     await do_every_monday();
    // });

    // test, rm in production
    // schedule.scheduleJob('0 */1 * * * ?', async () => {
    //     await do_every_monday();
    // });

    return update_jwks();
}

async function update_jwks() {
    let expire_date = new Date();
    expire_date.setDate(expire_date.getDate() - 7 * 8);
    expire_date.setHours(expire_date.getHours() + 1);

    // test, rm in production
    // expire_date.setMinutes(expire_date.getMinutes() - 1);
    // expire_date.setSeconds(expire_date.getSeconds() + 30);

    // console.log("call update_jwks", expire_date);

    try {
        await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        }, async (t) => {
            await Jwk.destroy({
                where: {
                    cre_time: {
                        [Op.lt]: expire_date
                    }
                }
            });

            let jwks_in_db = await Jwk.findAll({
                attributes: ["cre_time", "kid"]
            });

            let need_remove = false;
            jwks_in_db.forEach((item) => {
                jwks_in_db.forEach(async (item2) => {
                    // 小于6天? 都给我死!
                    if (item.kid == item2.kid && item.cre_time.getTime() - item2.cre_time.getTime() < -6 * 24 * 60 * 60 * 1000) {
                        need_remove = true;
                    }
                });
            });

            if (need_remove) {
                await Jwk.destroy();
                console.error("!!!RM JWKS DUE TO DUPLICATE DETECTED!!!");
            }

            if (jwks_in_db.length >= 8 && !need_remove) {
                return;
            }
            let need_jwks = 8 - jwks_in_db.length;
            if (need_remove) need_jwks = 8;

            let cre_date = new Date();
            for (let i = 0; i < need_jwks; i++) {
                // 面向对象编程算是给我玩明白了
                // 这是多线程, 对象只有一个, 改了就都改了
                await AuthUtils.generateJwk(new Date(cre_date), t);
                cre_date.setDate(cre_date.getDate() - 7);

                // test, rm in production
                // cre_date.setMinutes(cre_date.getMinutes() - 1);
            }
        });
    } catch (e) {
        console.error("!!!update_jwks ERROR!!!");
        ErrorUtils.log(e as Error);
        return false;
    }
    return true;
}