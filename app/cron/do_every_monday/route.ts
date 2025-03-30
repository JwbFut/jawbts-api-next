import { ResponseUtils } from "@/components/ResponseUtils";
import { do_every_monday } from "@/instrumentation";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return ResponseUtils.needLogin();
    }

    if (await do_every_monday()) {
        return ResponseUtils.success();
    } else {
        return ResponseUtils.serverError("Failed to update JWKS");
    }
}