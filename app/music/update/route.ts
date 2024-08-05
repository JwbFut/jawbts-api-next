import { AuthUtils } from "@/components/AuthUtils";
import { ErrorUtils } from "@/components/ErrorUtils";
import { MusicUtils } from "@/components/MusicUtils";
import { ResponseUtils } from "@/components/ResponseUtils";
import { createClient, sql } from "@vercel/postgres";

export const dynamic = 'force-dynamic';

async function fetch_folder(folder: number, pn: number) {
    let response_js;
    try {
        response_js = await fetch('http://api.bilibili.com/medialist/gateway/base/spaceDetail?media_id='
            + folder + '&pn=' + pn + ' &ps=20')
        .then(response => response.json());
    } catch(e) {
        ErrorUtils.log(e as Error);
        return ResponseUtils.serverError("Unknown");
    }
    if (response_js.code != 0) return ResponseUtils.serverError("Fetching bilibili api, bad response code");
    return response_js;
}

function treat_row_data(json: any) {
    const mediaList = json.data.medias;
    let resList = [];
    for (let i in mediaList) {
        const media = mediaList[i];
        resList.push({bvid: media.bvid, cover: media.cover, title: media.title});
    }
    return resList;
}

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

    let music_list_row = await fetch_folder(folder, 1);
    if (music_list_row instanceof Response) return music_list_row;
    const num = music_list_row.data.info.media_count;
    let music_list: any[] = [];
    music_list = music_list.concat(treat_row_data(music_list_row));

    const pages = Math.ceil(num / 20);
    for (var i = 2; i <= pages; i++) {
        let music_list_row = await fetch_folder(folder, i);
        if (music_list_row instanceof Response) return music_list_row;
        music_list = music_list.concat(treat_row_data(music_list_row));
    }

    if (music_list_row.data.info.cover) {
        await sql`  UPDATE users
                    SET bilibili_music_folder_cover = ${music_list_row.data.info.cover}
                    WHERE id = ${login.id}`;
    }

    const table_id = 'm' + login.id + 'f' + folder;
    const client = createClient();
    await client.connect();
    try {
        await MusicUtils.createIfNotExists(client, table_id);
        await MusicUtils.sync(client, table_id, music_list);
    } finally {
        await client.end();
    }
    return ResponseUtils.success();
}