import { AuthUtils } from "@/components/AuthUtils";
import { ResponseUtils } from "@/components/ResponseUtils";
import { sql } from "@vercel/postgres";

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const user_name = searchParams.get('user_name');

    if (user_name === null) return ResponseUtils.missing("param: user_name");

    const { rows } = await sql`SELECT id FROM users WHERE username = ${user_name}`;
    const id = rows.map((row) => {
        return row.id;
    });

    if (id.length === 0) {
        return ResponseUtils.bad("User: not exists");
    }

    const state = AuthUtils.generateState();
    sql`UPDATE users
    SET state = ${state}
    WHERE id = ${id[0]}`;

    return ResponseUtils.successJson({
        url: 'https://github.com/login/oauth/authorize?'
        + 'client_id=0f87423a9c6e9047ff57&'
        + 'redirect_uri=' + process.env.ORIGIN_URL + '/auth/github/callback' + '&'
        + 'scope=(no scope)&state=' + state
    });
}