import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: Request,
    { params }: { params: { name: string } }) {
    return ResponseUtils.serverError("This route not available");

    // const res = await AuthUtils.checkLogin(request);
    // if (res instanceof Response) {
    //     return res;
    // }

    // const { rows } = await sql` SELECT * FROM users
    //                             WHERE username = ${params.name}`;

    // if (rows.length == 0) {
    //     return ResponseUtils.notFound("User Name Not Found");
    // }

    // return ResponseUtils.successJson(rows[0]);
}