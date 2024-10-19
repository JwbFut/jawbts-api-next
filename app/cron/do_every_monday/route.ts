import { ResponseUtils } from "@/components/ResponseUtils";
import { do_every_monday } from "@/instrumentation";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return ResponseUtils.needLogin();
    // }

    do_every_monday();

    return ResponseUtils.success();
}