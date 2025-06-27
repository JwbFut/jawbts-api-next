import { AuthUtils } from "@/components/AuthUtils";
import sequelize from "@/components/database/db";
import { MusicDataType, User } from "@/components/database/dbTypes";
import { ErrorHandler } from "@/components/ErrorHandler";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    let formData;
    try {
        formData = await request.json();
        if (!formData["music_data"]) {
            throw new Error();
        }
    } catch (e) {
        return ErrorHandler.invalidFormData();
    }
    const music_data: any[] = formData["music_data"];

    if (music_data.length === 0) return ErrorHandler.invalidFormData();

    let musics;
    try {
        musics = await User.findOne({
            attributes: ["music_data", "async_key"],
            where: { username: res.username }
        });
    } catch (e) {
        return ErrorHandler.databaseError();
    }

    if (!musics) return ErrorHandler.userNotExists();

    let k = 0;
    musics.music_data.forEach((music: MusicDataType, index: number) => {
        for (let i = 0; i < music_data.length; i++) {
            if (music.inner_id == music_data[i].inner_id) {
                if (music_data[i].tags) musics.music_data[index].tags = music_data[i].tags;
                if (music_data[i].likes != undefined) musics.music_data[index].likes = music_data[i].likes;
                k++;
            }
        }
    });
    if (k != music_data.length) return ErrorHandler.invalidFormData();

    let async_time = Date.now();
    musics.async_key.music_data = async_time;

    try {
        await sequelize.transaction(async (t) => {
            await User.update({
                music_data: musics.music_data,
                async_key: musics.async_key
            }, {
                where: { username: res.username },
                transaction: t
            });
        });
    } catch (e) {
        return ErrorHandler.databaseError();
    }

    return ResponseUtils.successJson({ async_time: async_time });
}