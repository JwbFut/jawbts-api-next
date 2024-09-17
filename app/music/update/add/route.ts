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
    const music_data: MusicDataType[] = formData["music_data"];
    let cleaned_data: MusicDataType[] = [];
    music_data.forEach(data => {
        if (!data.title ||!data.author ||!data.inner_id || !data.tags || !data.static_tags || data.likes === undefined) return;
        cleaned_data.push({
            title: data.title,
            author: data.author,
            inner_id: data.inner_id,
            tags: data.tags,
            static_tags: data.static_tags,
            likes: data.likes
        });
    });

    if (cleaned_data.length === 0) return ResponseUtils.bad("Request. No valid data.");

    const musics = await jaw_db
        .selectFrom("users")
        .select("music_data")
        .select("async_key")
        .where("username", "=", res.username)
        .executeTakeFirst();

    if (!musics) return ResponseUtils.bad("Username. User not found.");

    cleaned_data = cleaned_data.filter(data => {
        for (let i = 0; i < musics.music_data.length; i++) {
            if (musics.music_data[i].inner_id == data.inner_id) {
                return false;
            }
        }
        return true;
    });

    let async_time = Date.now();
    musics.async_key.music_data = async_time;

    let client = await db.connect();
    let d = JSON.stringify(cleaned_data).replace(/'/g, "''");
    if (d.includes("$")) return ResponseUtils.bad("Music. Invalid data.");
    await client.query(`UPDATE users SET music_data = music_data || '${d}', async_key = '${JSON.stringify(musics.async_key)}' WHERE username = '${res.username.toString()}';`);

    return ResponseUtils.successJson({async_time: async_time});
}