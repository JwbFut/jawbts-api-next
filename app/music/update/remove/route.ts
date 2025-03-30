import { AuthUtils } from "@/components/AuthUtils";
import sequelize from "@/components/database/db";
import { User } from "@/components/database/dbTypes";
import { ErrorUtils } from "@/components/ErrorUtils";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    if (!res.username) return ResponseUtils.badToken("No aud claim.");

    let formData;
    try {
        formData = await request.json();
        if (!formData["music_data"]) {
            throw new Error();
        }
    } catch (e) {
        return ResponseUtils.bad("Request. Invalid JSON.")
    }
    const music_data: any[] = formData["music_data"];

    if (music_data.length === 0) return ResponseUtils.bad("Request. No valid data.");

    let musics;
    try {
        musics = await User.findOne({
            attributes: ["music_data", "async_key"],
            where: { username: res.username }
        });
    } catch (e) {
        ErrorUtils.log(e as Error);
        return ResponseUtils.serverError("Database Error");
    }

    if (!musics) return ResponseUtils.bad("Username. User not found.");

    let updated_data = musics.music_data.filter(data => {
        for (let i = 0; i < music_data.length; i++) {
            if (data.inner_id === music_data[i].inner_id) {
                return false;
            }
        }
        return true;
    });

    let async_time = Date.now();
    musics.async_key.music_data = async_time;

    try {
        await sequelize.transaction(async (t) => {
            await User.update({
                music_data: updated_data,
                async_key: musics.async_key
            }, {
                where: { username: res.username },
                transaction: t
            });
        });
    } catch (e) {
        ErrorUtils.log(e as Error);
        return ResponseUtils.serverError("Database Error");
    }

    return ResponseUtils.successJson({ async_time: async_time });
}