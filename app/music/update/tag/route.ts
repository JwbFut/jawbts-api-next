import { jaw_db, MusicDataType } from "@/app/Db";
import { AuthUtils } from "@/components/AuthUtils";
import { ResponseUtils } from "@/components/ResponseUtils";
import { db } from "@vercel/postgres";

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

    const musics = await jaw_db
        .selectFrom("users")
        .select("music_data")
        .select("async_key")
        .where("username", "=", res.username)
        .executeTakeFirst();

    if (!musics) return ResponseUtils.bad("Username. User not found.");

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
    if (k != music_data.length) return ResponseUtils.bad(`Music. Some music not found or duplicated.`);

    let async_time = Date.now();
    musics.async_key.music_data = async_time;

    let client = await db.connect();
    let d = JSON.stringify(musics.music_data).replace(/'/g, "''");
    if (d.includes("$")) return ResponseUtils.bad("Music. Invalid data.");
    await client.query(`UPDATE users SET music_data = '${d}', async_key = '${JSON.stringify(musics.async_key)}' WHERE username = '${res.username.toString()}';`);

    return ResponseUtils.successJson({async_time: async_time});
}