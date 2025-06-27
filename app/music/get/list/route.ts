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

    let musics;
    try {
        musics = await User.findOne({
            attributes: ["music_data"],
            where: { username: res.username }
        });
    } catch (e) {
        return ErrorHandler.databaseError();
    }

    if (!musics) return ErrorHandler.userNotExists();

    return ResponseUtils.successJson(musics.music_data);
}