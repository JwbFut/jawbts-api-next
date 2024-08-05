import { jaw_db } from "@/app/Db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    let res = await jaw_db
        .selectFrom("jwks")
        .select(["n", "kid"])
        .execute();
    let res_full: {kty: string, use: string, kid: string, n: string, e: string}[] = [];
    res.forEach((i) => {
        res_full.push({kty: "RSA", use: "sig", kid: i.kid, n: i.n, e: "AQAB"})
    })
    return Response.json({keys: res_full});
}