import { VercelClient, sql } from "@vercel/postgres";

export class MusicUtils {
    static async createIfNotExists(client: VercelClient, table_id: string) {
        await client.query(`CREATE TABLE IF NOT EXISTS ${table_id} (
            bvid TEXT PRIMARY KEY,
            cover TEXT,
            title TEXT,
            love INT DEFAULT 0
        )`);
    }
    static async read(client: VercelClient, table_id: string) {
        const { rows } = await client.query(`SELECT * FROM ${table_id}`);
        let list: { bvid: string; cover: string; title: string; love: number; }[] = [];
        rows.map(row => {
            list.push({ bvid: row.bvid, cover: row.cover, title: row.title, love: row.love });
        })
        return list;
    }
    static async readWithOutLove(client: VercelClient, table_id: string) {
        const { rows } = await client.query(`SELECT bvid, cover, title FROM ${table_id}`);
        let list: { bvid: string; cover: string; title: string }[] = [];
        rows.map(row => {
            list.push({ bvid: row.bvid, cover: row.cover, title: row.title });
        })
        return list;
    }
    static async add(client: VercelClient, table_id: string, jsonList: any) {
        if (jsonList.length == 0) return;
        let values = "";
        for (let i = 0; i < jsonList.length; i++) {
            const json = jsonList[i];
            values += `('${json.bvid}','${json.cover}','${json.title}')`;
            if (i != (jsonList.length - 1)) values += ',';
        }
        await client.query(`INSERT INTO ${table_id} (bvid, cover, title) VALUES ${values}`);
    }
    static async remove(client: VercelClient, table_id: string, jsonList: any) {
        for (let i = 0; i < jsonList.length; i++) {
            const json = jsonList[i];
            await client.query(`DELETE FROM ${table_id} WHERE bvid = '${json.bvid}'`);
        }
    }
    static async sync(client: VercelClient, table_id: string, jsonList: { bvid: string; cover: string; title: string }[]) {
        const cur_list = await this.readWithOutLove(client, table_id);
        let cur_need_remove = this.bDontHave(cur_list, jsonList);
        let cur_dont_have = this.bDontHave(jsonList, cur_list);
        await this.remove(client, table_id, cur_need_remove);
        await this.add(client, table_id, cur_dont_have);
    }
    static bDontHave(a: { bvid: string; cover: string; title: string }[], b: { bvid: string; cover: string; title: string }[]) {
        let ans = [];
        for (let i = 0; i < a.length; i++) {
            let flag = false;
            for (let j = 0; j < b.length; j++) {
                if (a[i].bvid == b[j].bvid) {
                    flag = true;
                    continue;
                }
            }
            if (!flag) ans.push(a[i]);
        }
        return ans;
    }
}