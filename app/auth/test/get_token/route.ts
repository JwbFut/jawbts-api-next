import { jaw_db } from "@/app/Db";
import { AuthUtils } from "@/components/AuthUtils"
import { ResponseUtils } from "@/components/ResponseUtils"
import { sql } from "@vercel/postgres";
import { assert } from "console";
import * as jose from "jose"
import { NextRequest, NextResponse, userAgent } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    let jwt = await AuthUtils.getJwt("winsrewu", ["website", "api"]);
    return ResponseUtils.successJson(jwt);

    const res = await jaw_db
        .selectFrom("users")
        .select(["username", "ref_tokens"])
        .where("id", "=", 78122384)
        .executeTakeFirst();
    if (!res) return ResponseUtils.bad("Account: Account Not Exists");
    res.ref_tokens = [];

    await sql`
    UPDATE users
    SET ref_tokens = ${JSON.stringify(res.ref_tokens)} WHERE username = ${res.username.toString()}
    `;

    return ResponseUtils.serverError("This route not available.");
    // var res;
    // var tokens = [{
    //     state_c: AuthUtils.generateState(),
    //     ref_token: AuthUtils.generateToken(),
    //     exp_time: new Date(),
    //     desc_c: "Windows " + request.ip
    // }];

    // res = await sql`
    //     UPDATE users
    //     SET ref_tokens = ${JSON.stringify(tokens)}
    // `;

    // res = await jaw_db
    //     .selectFrom("users")
    //     .select("ref_tokens")
    //     .executeTakeFirst();
    // let d;
    // if (typeof res?.ref_tokens[0].exp_time === "string") {
    //     d = Date.parse(res.ref_tokens[0].exp_time)
    // }
    // return NextResponse.json(res ? d : "NULL");

    // const { browser, os } = userAgent(request);
    // return NextResponse.json(os.name && browser.name ? os.name + "-" + browser.name : "NULL");


    // let jwt = await AuthUtils.getJwt("winsrewu", ["website", "api"]);
    // return ResponseUtils.successJson(jwt);
}