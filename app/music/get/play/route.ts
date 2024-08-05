import { AuthUtils } from "@/components/AuthUtils";
import { ErrorUtils } from "@/components/ErrorUtils";
import { MusicUtils } from "@/components/MusicUtils";
import { ResponseUtils } from "@/components/ResponseUtils";
import { createClient, sql } from "@vercel/postgres";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const login = await AuthUtils.checkLogin(request);
    if (login instanceof Response) return login;

    const { rows } = await sql` SELECT bilibili_music_folder FROM users
                                WHERE id = ${login.id}`;
    const sqlRes = rows.map((row) => {
        return row.bilibili_music_folder;
    })
    const folder = sqlRes[0];
    if (!folder) {
        return ResponseUtils.missing("bilibili_music_folder: Set It First!");
    }

    const table_id = 'm' + login.id + 'f' + folder;
    let res_list;
    const client = createClient();
    await client.connect();
    try {
        res_list = await MusicUtils.read(client, table_id);
    } finally {
        await client.end();
    }

    return ResponseUtils.successJson(res_list);
}