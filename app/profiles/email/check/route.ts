import { AuthUtils } from "@/components/AuthUtils";
import { EmailDataType, User } from "@/components/database/dbTypes";
import { ErrorHandler } from "@/components/ErrorHandler";
import { ResponseUtils } from "@/components/ResponseUtils";
import { Resend } from "resend";

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_EMAIL_SERVICE_TOKEN);

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    try {
        const user = await User.findOne({ where: { username: res.username }, attributes: ["email"] });
        if (!user) return ErrorHandler.userNotExists();
        if (!user.email) ResponseUtils.successJson({ verified: false });
        return ResponseUtils.successJson({ verified: user.email.verified });
    } catch (e) {
        return ErrorHandler.userNotExists();
    }
}