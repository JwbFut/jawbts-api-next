import { Jwk } from "@/components/database/dbTypes";
import { ErrorHandler } from "@/components/ErrorHandler";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    let res;
    try {
        res = await Jwk.findAll({
            attributes: ["n", "kid"]
        });
    } catch (e) {
        return ErrorHandler.databaseError();
    }

    let res_full: { kty: string, use: string, kid: string, n: string, e: string }[] = [];
    res.forEach((i) => {
        res_full.push({ kty: "RSA", use: "sig", kid: i.kid, n: i.n, e: "AQAB" })
    })

    return Response.json({ keys: res_full });
}