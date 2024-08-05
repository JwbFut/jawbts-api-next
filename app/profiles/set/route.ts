import { jaw_db } from "@/app/Db";
import { AuthUtils } from "@/components/AuthUtils";
import { ResponseUtils } from "@/components/ResponseUtils";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const res = await AuthUtils.checkLogin(request);
    if (res instanceof Response) {
        return res;
    }

    if (!res.username) return ResponseUtils.badToken("No aud claim.");

    const formData = await request.json();
    let description = formData["description"];
    let avatar_url = formData["avatar_url"];

    if (description) {
        description = description.toString();
        await jaw_db
            .updateTable("users")
            .set({
                description: description
            })
            .where("username", "=", res.username)
            .execute()
    }

    if (avatar_url) {
        avatar_url = avatar_url.toString();
        await jaw_db
            .updateTable("users")
            .set({
                avatar_url: avatar_url
            })
            .where("username", "=", res.username)
            .execute()
    }

    return ResponseUtils.success();
}