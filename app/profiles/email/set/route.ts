import { AuthUtils } from "@/components/AuthUtils";
import { EmailDataType, User } from "@/components/database/dbTypes";
import { ResponseUtils } from "@/components/ResponseUtils";
import { Resend } from "resend";

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_EMAIL_SERVICE_TOKEN);

export async function GET(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
        return ResponseUtils.missing("email");
    }

    const code = AuthUtils.generateRandomString(64);

    let newEmail: EmailDataType = {
        email: email,
        verified: false,
        verify_code: code,
        verify_exp_time: new Date(Date.now() + 60 * 1000) // 1 min
    }

    if (!process.env.RESEND_EMAIL_SENDER) {
        throw new Error("RESEND_EMAIL_SENDER not set");
    }

    try {
        await resend.emails.send({
            from: process.env.RESEND_EMAIL_SENDER,
            to: email,
            subject: "Verify your email",
            text: `Please visit ${process.env.WEBSITE_URL}/nav/profiles/email/verify?code=${code} to verify your email.`
        });
    } catch (e) {
        return ResponseUtils.serverError("Failed to send email", e);
    }

    try {
        await User.update({ email: newEmail }, { where: { username: res.username } });
        return ResponseUtils.success();
    } catch (e) {
        return ResponseUtils.databaseError(e);
    }
}