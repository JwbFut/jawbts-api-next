import { AuthUtils } from "@/components/AuthUtils";
import { ResponseUtils } from "@/components/ResponseUtils";
import { sql } from "@vercel/postgres";

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    const { rows } = await sql` SELECT * FROM users
                                WHERE id = ${res.id}`;

    return ResponseUtils.successJson(rows[0]);
}