import { AuthUtils } from "@/components/AuthUtils";
import { ResponseUtils } from "@/components/ResponseUtils";
import { sql } from "@vercel/postgres";

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    const { rows } = await sql` UPDATE users
                                SET token = null, token_expire = null
                                WHERE id = ${res.id}`;

    return ResponseUtils.success();
}
