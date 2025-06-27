import { ResponseUtils } from "@/components/ResponseUtils";
import { do_every_monday } from "@/components/JWKSRotationManager";
import { ErrorHandler } from "@/components/ErrorHandler";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return ErrorHandler.needLogin();
    }

    if (await do_every_monday()) {
        return ResponseUtils.success();
    } else {
        return ErrorHandler.unknownError();
    }
}