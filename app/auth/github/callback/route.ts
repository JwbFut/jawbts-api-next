import { AuthUtils } from "@/components/AuthUtils";
import { ErrorUtils } from "@/components/ErrorUtils";
import { sql } from "@vercel/postgres";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    const { rows } = await sql`SELECT id FROM users WHERE state = ${state}`;
    if (rows.length === 0) {
        redirect('https://jawbts.org/auth.html#fail_reason=wrong_state');
    }
    const id = rows.map((row) => {
        return row.id;
    });

    let data = null;
    try {
        data = await fetch('https://github.com/login/oauth/access_token?' +
            'client_id=0f87423a9c6e9047ff57&' +
            'client_secret=' + process.env.GITHUB_CLIENT_SECRET + '&' +
            'code=' + code, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        }).then((response) => response.json()).then((data) => {return data});
    } catch(e) {
        ErrorUtils.log(e as Error);
    }

    if (data == null) {
        redirect('https://jawbts.org/auth.html#fail_reason=Server_Network_Exception');
    }

    const access_token = data.access_token;
    if (access_token == null) {
        redirect('https://jawbts.org/auth.html#fail_reason=Bad_Code_(Maybe_Expired)');
    }

    if (data.token_type != "bearer") {
        redirect('https://jawbts.org/auth.html#fail_reason=Wrong_Token_Type');
    }

    data = null;
    try {
        data = await fetch('https://api.github.com/user', {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": "Bearer " + access_token
            }
        }).then((response) => response.json()).then((data) => {return data});
    } catch(e) {
        ErrorUtils.log(e as Error);
    }

    if (data == null) {
        redirect('https://jawbts.org/auth.html#fail_reason=Server_Network_Exception');
    }

    if (data.id == null) {
        redirect('https://jawbts.org/auth.html#fail_reason=Bad_Token');
    }

    if (data.id != id[0]) {
        redirect('https://jawbts.org/auth.html#fail_reason=Wrong_Account');
    }

    const j_token = AuthUtils.generateToken();

    sql`UPDATE users
    SET state = null, token = ${AuthUtils.stringToHashConversion(j_token)},
    token_expire = to_timestamp(${Date.now() / 1000 + 3600 * 24 * 30})
    WHERE id = ${id[0]}`;

    redirect('https://jawbts.org/auth.html#subscribe_to_wisw_on_bilibili_please_'
        + '_to_tell_the_truth_im_just_making_this_long_enough_to_hide_token_haha=true'
        + '&token=' + j_token);
}